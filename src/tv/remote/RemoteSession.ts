import { Buffer } from 'buffer';
import TcpSocket from 'react-native-tcp-socket';

import type { ClientIdentity } from '../pairing/certificate';
import { frame, readVarint } from '../pairing/protobuf';
import { keyCodeForChar, KEY_FOR } from './keycodes';
import {
  buildAppLink,
  buildConfigure,
  buildImeBatchEdit,
  buildKeyInject,
  buildPingResponse,
  buildSetActive,
  OUR_FEATURES,
  parseRemoteMessage,
  type RemoteEvent,
} from './messages';
import type { RemoteKey } from '../types';

/** TLS port where the paired TV accepts commands (androidtvremote2). */
export const REMOTE_PORT = 6466;
const READY_TIMEOUT_MS = 10_000;

/**
 * Command connection to a TV that is already paired.
 * Answers the TV's handshake and pings, and sends keys and app links.
 */
export class RemoteSession {
  private socket: ReturnType<typeof TcpSocket.connectTLS> | null = null;
  private buffer = new Uint8Array(0);
  private features = OUR_FEATURES;
  private closed = false;
  private imeCounter = 0;
  private fieldCounter = 0;
  private onClose: (() => void) | null = null;

  constructor(
    private readonly host: string,
    private readonly identity: ClientIdentity,
    private readonly port: number = REMOTE_PORT,
  ) {}

  /** Called once if the connection drops after it was ready. */
  setOnClose(listener: () => void): void {
    this.onClose = listener;
  }

  /** Connects and resolves when the TV finished its handshake. Rejects if it does not. */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const done = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) {
          this.destroy();
          reject(error);
        } else {
          resolve();
        }
      };
      const timer = setTimeout(
        () => done(new Error('El TV no respondió. ¿Está encendido y en la misma red?')),
        READY_TIMEOUT_MS,
      );

      const socket = TcpSocket.connectTLS(
        {
          host: this.host,
          port: this.port,
          key: this.identity.keyPem,
          cert: this.identity.certPem,
          rejectUnauthorized: false,
        } as Parameters<typeof TcpSocket.connectTLS>[0],
        () => {},
      );
      this.socket = socket;

      socket.on('data', (data) => {
        this.onData(typeof data === 'string' ? Buffer.from(data, 'latin1') : data, () => done());
      });
      socket.on('error', (error) => {
        done(new Error(`Error de conexión: ${String(error?.message ?? error)}`));
      });
      socket.on('close', () => {
        if (!settled) done(new Error('El TV cerró la conexión'));
        else this.handleClosed();
      });
    });
  }

  get isOpen(): boolean {
    return this.socket !== null && !this.closed;
  }

  sendKey(key: RemoteKey): void {
    this.write(buildKeyInject(KEY_FOR[key]));
  }

  /**
   * Types text live. Digits go as key presses (confirmed to work on the user's TV);
   * everything else goes through the IME, one insert per character (only the new text:
   * the TV inserts it at the cursor, so resending earlier text would duplicate it).
   */
  sendText(text: string): void {
    for (const char of text) {
      if (char >= '0' && char <= '9') {
        const code = keyCodeForChar(char);
        if (code !== null) this.write(buildKeyInject(code));
      } else {
        this.write(buildImeBatchEdit(this.imeCounter, this.fieldCounter, char));
      }
    }
  }

  sendAppLink(link: string): void {
    this.write(buildAppLink(link));
  }

  close(): void {
    this.onClose = null;
    this.destroy();
  }

  private write(message: number[]): void {
    if (!this.socket || this.closed) throw new Error('No hay conexión con el TV');
    this.socket.write(Buffer.from(frame(message)));
  }

  private destroy(): void {
    this.closed = true;
    this.socket?.destroy();
    this.socket = null;
  }

  private handleClosed(): void {
    if (this.closed) return;
    this.closed = true;
    this.socket = null;
    const listener = this.onClose;
    this.onClose = null;
    listener?.();
  }

  private onData(chunk: Uint8Array, ready: () => void): void {
    const merged = new Uint8Array(this.buffer.length + chunk.length);
    merged.set(this.buffer);
    merged.set(chunk, this.buffer.length);
    this.buffer = merged;

    for (;;) {
      const len = readVarint(this.buffer, 0);
      if (!len || this.buffer.length < len.next + len.value) return;
      const body = this.buffer.slice(len.next, len.next + len.value);
      this.buffer = this.buffer.slice(len.next + len.value);
      let event: RemoteEvent;
      try {
        event = parseRemoteMessage(body);
      } catch {
        continue; // Ignore messages we cannot read; the rest still works.
      }
      this.handle(event, ready);
    }
  }

  private handle(event: RemoteEvent, ready: () => void): void {
    switch (event.type) {
      case 'configure':
        // Offer only what both sides support (as tronikos/androidtvremote2 does).
        this.features = event.features ? event.features & OUR_FEATURES : OUR_FEATURES;
        this.write(buildConfigure(this.features));
        break;
      case 'setActive':
        this.write(buildSetActive(this.features));
        ready();
        break;
      case 'imeBatch':
        this.imeCounter = event.imeCounter;
        this.fieldCounter = event.fieldCounter;
        break;
      case 'ping':
        this.write(buildPingResponse(event.val1));
        break;
      case 'start':
        ready();
        break;
      default:
        break;
    }
  }
}
