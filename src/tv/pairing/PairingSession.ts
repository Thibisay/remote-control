import { Buffer } from 'buffer';
import TcpSocket from 'react-native-tcp-socket';

import { publicPartsFromCert, type ClientIdentity } from './certificate';
import {
  buildPairingConfiguration,
  buildPairingOption,
  buildPairingRequest,
  buildPairingSecret,
  PAIRING_STATUS_OK,
  parsePairingMessage,
  type PairingKind,
  type PairingReply,
} from './messages';
import { frame, readVarint } from './protobuf';
import { computeSecret, PairingError } from './secret';

/** TLS port where the TV runs the pairing handshake (androidtvremote2). */
export const PAIRING_PORT = 6467;
const STEP_TIMEOUT_MS = 10_000;
const SERVICE_NAME = 'atvremote';

type Waiter = { resolve: (r: PairingReply) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> };

type ServerCert = { modulus: string; exponent: string };

/**
 * One pairing attempt with one TV:
 *   start()  -> TLS connect, handshake up to the point where the TV shows its code
 *   finish() -> send the secret computed from the code and wait for the TV's ack
 */
export class PairingSession {
  private socket: ReturnType<typeof TcpSocket.connectTLS> | null = null;
  private buffer = new Uint8Array(0);
  private inbox: PairingReply[] = [];
  private waiter: Waiter | null = null;
  private failure: Error | null = null;
  private serverCert: ServerCert | null = null;

  constructor(
    private readonly host: string,
    private readonly identity: ClientIdentity,
    private readonly clientName: string,
    private readonly port: number = PAIRING_PORT,
  ) {}

  async start(): Promise<void> {
    await this.connect();
    this.serverCert = (await this.socket!.getPeerCertificate()) as ServerCert;
    if (!this.serverCert?.modulus || !this.serverCert?.exponent) {
      throw new PairingError('No se pudo leer el certificado del TV');
    }

    this.send(buildPairingRequest(SERVICE_NAME, this.clientName));
    await this.expect('requestAck');
    this.send(buildPairingOption());
    await this.expect('option');
    this.send(buildPairingConfiguration());
    await this.expect('configurationAck');
    // The TV now shows the 6-character code.
  }

  async finish(code: string): Promise<void> {
    if (!this.socket || !this.serverCert) throw new PairingError('Sesión de emparejamiento no iniciada');
    const secret = computeSecret(
      publicPartsFromCert(this.identity.certPem),
      { modulusHex: this.serverCert.modulus, exponentHex: this.serverCert.exponent },
      code.trim(),
    );
    this.send(buildPairingSecret(secret));
    await this.expect('secretAck');
  }

  close(): void {
    this.fail(new Error('closed'));
    this.socket?.destroy();
    this.socket = null;
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.socket?.destroy();
        reject(new PairingError('El TV no respondió. ¿Está encendido y en la misma red?'));
      }, STEP_TIMEOUT_MS);

      const socket = TcpSocket.connectTLS(
        {
          host: this.host,
          port: this.port,
          key: this.identity.keyPem,
          cert: this.identity.certPem,
          // The TV uses a self-signed certificate; identity is proven by the code instead.
          rejectUnauthorized: false,
        } as Parameters<typeof TcpSocket.connectTLS>[0],
        () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve();
        },
      );
      this.socket = socket;

      socket.on('data', (data) => this.onData(typeof data === 'string' ? Buffer.from(data, 'latin1') : data));
      socket.on('error', (error) => {
        const err = new PairingError(`Error de conexión: ${String(error?.message ?? error)}`);
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
        this.fail(err);
      });
      socket.on('close', () => this.fail(new PairingError('El TV cerró la conexión')));
    });
  }

  private send(message: number[]): void {
    this.socket!.write(Buffer.from(frame(message)));
  }

  private onData(chunk: Uint8Array): void {
    const merged = new Uint8Array(this.buffer.length + chunk.length);
    merged.set(this.buffer);
    merged.set(chunk, this.buffer.length);
    this.buffer = merged;

    for (;;) {
      const len = readVarint(this.buffer, 0);
      if (!len) return;
      if (this.buffer.length < len.next + len.value) return;
      const body = this.buffer.slice(len.next, len.next + len.value);
      this.buffer = this.buffer.slice(len.next + len.value);
      try {
        this.deliver(parsePairingMessage(body));
      } catch (e) {
        this.fail(new PairingError(`Mensaje inválido del TV: ${(e as Error).message}`));
        return;
      }
    }
  }

  private deliver(reply: PairingReply): void {
    if (this.waiter) {
      const w = this.waiter;
      this.waiter = null;
      clearTimeout(w.timer);
      w.resolve(reply);
    } else {
      this.inbox.push(reply);
    }
  }

  private fail(error: Error): void {
    if (!this.failure) this.failure = error;
    if (this.waiter) {
      const w = this.waiter;
      this.waiter = null;
      clearTimeout(w.timer);
      w.reject(error);
    }
  }

  private next(): Promise<PairingReply> {
    const queued = this.inbox.shift();
    if (queued) return Promise.resolve(queued);
    if (this.failure) return Promise.reject(this.failure);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiter = null;
        reject(new PairingError('El TV no respondió durante el emparejamiento'));
      }, STEP_TIMEOUT_MS);
      this.waiter = { resolve, reject, timer };
    });
  }

  private async expect(kind: PairingKind): Promise<void> {
    const reply = await this.next();
    if (reply.status !== PAIRING_STATUS_OK) {
      throw new PairingError(`El TV rechazó el emparejamiento (estado ${reply.status})`);
    }
    if (reply.kind !== kind) {
      throw new PairingError(`Respuesta inesperada del TV (${reply.kind}, se esperaba ${kind})`);
    }
  }
}
