import { discoverTvs } from './discovery';
import { getOrCreateIdentity } from './pairing/certificate';
import { PairingSession } from './pairing/PairingSession';
import { RemoteSession } from './remote/RemoteSession';
import { APP_LINKS } from './remote/appLinks';
import type { TvRemote } from './TvRemote';
import type {
  ConnectionListener,
  ConnectionState,
  RemoteKey,
  TvApp,
  TvDevice,
} from './types';


/**
 * Real implementation, built step by step.
 * Discovery over mDNS, pairing (TLS + code) and the command connection (port 6466).
 * connect() first tries the command connection (TV already paired); if the TV
 * refuses it, it falls back to pairing.
 */
export class RealTvRemote implements TvRemote {
  private state: ConnectionState = { status: 'disconnected' };
  private listeners = new Set<ConnectionListener>();
  private session: PairingSession | null = null;
  private remoteSession: RemoteSession | null = null;
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
    this.closeRemote();
    const attempt = ++this.attempt;
    this.setState({ status: 'pairing', device, awaitingCode: false });
    // Let the UI show the "preparing" screen before any heavy work starts.
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    try {
      // The first time this generates the client certificate; it can take a while.
      const identity = await getOrCreateIdentity();
      if (attempt !== this.attempt) return;
      // Already paired? Then the command connection just works.
      if (await this.openRemote(device, identity, attempt)) return;
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
      const attempt = this.attempt;
      await session.finish(code);
      this.closeSession();
      const identity = await getOrCreateIdentity();
      // Some TVs need a moment before accepting the command connection after pairing.
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      if (!(await this.openRemote(current.device, identity, attempt))) {
        throw new Error('Emparejado, pero el TV no aceptó la conexión de control.');
      }
    } catch (e) {
      this.closeSession();
      this.setState({ status: 'error', message: errorMessage(e), device: current.device });
    }
  }

  async sendKey(key: RemoteKey): Promise<void> {
    this.requireRemote().sendKey(key);
  }

  async sendText(text: string): Promise<void> {
    this.requireRemote().sendText(text);
  }

  async openApp(app: TvApp): Promise<void> {
    const link = APP_LINKS[app];
    if (!link) throw new Error('Esta app aún no tiene un enlace verificado.');
    this.requireRemote().sendAppLink(link);
  }

  async disconnect(): Promise<void> {
    this.attempt++;
    this.closeSession();
    this.closeRemote();
    this.setState({ status: 'disconnected' });
  }

  /** Opens the command connection; true when the TV is ready (state becomes connected). */
  private async openRemote(
    device: TvDevice,
    identity: Awaited<ReturnType<typeof getOrCreateIdentity>>,
    attempt: number,
  ): Promise<boolean> {
    const remote = new RemoteSession(device.host, identity);
    try {
      await remote.start();
    } catch {
      remote.close();
      return false;
    }
    if (attempt !== this.attempt) {
      remote.close();
      return true;
    }
    this.remoteSession = remote;
    remote.setOnClose(() => {
      if (this.remoteSession !== remote) return;
      this.remoteSession = null;
      this.setState({ status: 'error', message: 'Se perdió la conexión con el TV.', device });
    });
    this.setState({ status: 'connected', device });
    return true;
  }

  private requireRemote(): RemoteSession {
    const remote = this.remoteSession;
    if (!remote || !remote.isOpen) throw new Error('No hay conexión con el TV');
    return remote;
  }

  private closeRemote(): void {
    this.remoteSession?.close();
    this.remoteSession = null;
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
