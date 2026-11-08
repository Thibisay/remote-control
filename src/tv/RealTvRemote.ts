import { discoverTvs } from './discovery';
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
 * Step 1: discovery over mDNS. Pairing and commands come in the next steps.
 */
export class RealTvRemote implements TvRemote {
  private state: ConnectionState = { status: 'disconnected' };
  private listeners = new Set<ConnectionListener>();

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
    this.setState({ status: 'error', message: 'Emparejamiento aún no implementado.', device });
  }

  async submitPairingCode(_code: string): Promise<void> {
    throw new Error(NOT_READY);
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
    this.setState({ status: 'disconnected' });
  }

  private setState(next: ConnectionState): void {
    this.state = next;
    this.listeners.forEach((listener) => listener(next));
  }
}
