import { discoverTvs } from './discovery';
import { getOrCreateIdentity } from './pairing/certificate';
import { PairingSession } from './pairing/PairingSession';
import type { TvRemote } from './TvRemote';
import type {
  ConnectionListener,
  ConnectionState,
  RemoteKey,
  TvApp,
  TvDevice,
} from './types';

const NOT_READY = 'Esta función aún no está implementada con TVs reales.';

/**
 * Real implementation, built step by step.
 * Step 1: discovery over mDNS. Step 2: pairing (TLS + code). Commands come next.
 */
export class RealTvRemote implements TvRemote {
  private state: ConnectionState = { status: 'disconnected' };
  private listeners = new Set<ConnectionListener>();
  private session: PairingSession | null = null;
  private attempt = 0;

  getState = (): ConnectionState => this.state;

  subscribe = (listener: ConnectionListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  async discover(): Promise<TvDevice[]> {
    this.setState({ status: 'searching' });
    try {
      return await discoverTvs();
    } finally {
      this.setState({ status: 'disconnected' });
    }
  }

  async connect(device: TvDevice): Promise<void> {
    this.closeSession();
    const attempt = ++this.attempt;
    this.setState({ status: 'pairing', device, awaitingCode: false });
    try {
      // The first time this generates the client certificate; it can take a while.
      const identity = await getOrCreateIdentity();
      const session = new PairingSession(device.host, identity, 'Full Remote Control');
      this.session = session;
      await session.start();
      if (attempt !== this.attempt) return;
      this.setState({ status: 'pairing', device, awaitingCode: true });
    } catch (e) {
      if (attempt !== this.attempt) return;
      this.closeSession();
      this.setState({ status: 'error', message: errorMessage(e), device });
    }
  }

  async submitPairingCode(code: string): Promise<void> {
    const current = this.state;
    const session = this.session;
    if (current.status !== 'pairing' || !session) {
      throw new Error('Not pairing: call connect() first');
    }
    try {
      await session.finish(code);
      this.closeSession();
      // Paired. Sending keys needs the remote connection (next step).
      this.setState({ status: 'connected', device: current.device });
    } catch (e) {
      this.closeSession();
      this.setState({ status: 'error', message: errorMessage(e), device: current.device });
    }
  }

  async sendKey(_key: RemoteKey): Promise<void> {
    throw new Error(NOT_READY);
  }

  async sendText(_text: string): Promise<void> {
    throw new Error(NOT_READY);
  }

  async openApp(_app: TvApp): Promise<void> {
    throw new Error(NOT_READY);
  }

  async disconnect(): Promise<void> {
    this.attempt++;
    this.closeSession();
    this.setState({ status: 'disconnected' });
  }

  private closeSession(): void {
    this.session?.close();
    this.session = null;
  }

  private setState(next: ConnectionState): void {
    this.state = next;
    this.listeners.forEach((listener) => listener(next));
  }
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
