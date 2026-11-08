import type { TvRemote } from './TvRemote';
import type {
  ConnectionListener,
  ConnectionState,
  RemoteKey,
  TvApp,
  TvDevice,
} from './types';

/** Pairing code the mock accepts. Only for the fake implementation. */
export const MOCK_PAIRING_CODE = '000000';

const MOCK_DEVICES: TvDevice[] = [
  { id: 'mock-living-room', name: 'Sala (TV de prueba)', host: 'mock-1', port: 0 },
  { id: 'mock-bedroom', name: 'Cuarto (TV de prueba)', host: 'mock-2', port: 0 },
];

interface MockOptions {
  /** Simulated latency per operation, in ms. */
  delayMs?: number;
}

/**
 * Fake TvRemote used to build and test the UI without a real TV.
 * It does not touch the network. Replaced by the real implementation later.
 */
export class MockTvRemote implements TvRemote {
  private state: ConnectionState = { status: 'disconnected' };
  private listeners = new Set<ConnectionListener>();
  private readonly delayMs: number;

  constructor(options: MockOptions = {}) {
    this.delayMs = options.delayMs ?? 1200;
  }

  getState = (): ConnectionState => this.state;

  subscribe = (listener: ConnectionListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  async discover(): Promise<TvDevice[]> {
    this.setState({ status: 'searching' });
    await this.wait();
    this.setState({ status: 'disconnected' });
    return MOCK_DEVICES;
  }

  async connect(device: TvDevice): Promise<void> {
    await this.wait(this.delayMs / 3);
    this.setState({ status: 'pairing', device, awaitingCode: true });
  }

  async submitPairingCode(code: string): Promise<void> {
    const current = this.state;
    if (current.status !== 'pairing') {
      throw new Error('Not pairing: call connect() first');
    }
    await this.wait(this.delayMs / 2);
    if (code.trim() === MOCK_PAIRING_CODE) {
      this.setState({ status: 'connected', device: current.device });
    } else {
      this.setState({
        status: 'error',
        message: 'Código incorrecto',
        device: current.device,
      });
    }
  }

  async sendKey(_key: RemoteKey): Promise<void> {
    if (this.state.status !== 'connected') {
      throw new Error('Not connected');
    }
    await this.wait(50);
  }

  async sendText(_text: string): Promise<void> {
    if (this.state.status !== 'connected') {
      throw new Error('Not connected');
    }
    await this.wait(30);
  }

  async openApp(_app: TvApp): Promise<void> {
    if (this.state.status !== 'connected') {
      throw new Error('Not connected');
    }
    await this.wait(50);
  }

  async disconnect(): Promise<void> {
    this.setState({ status: 'disconnected' });
  }

  private setState(next: ConnectionState): void {
    this.state = next;
    this.listeners.forEach((listener) => listener(next));
  }

  private wait(ms: number = this.delayMs): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
