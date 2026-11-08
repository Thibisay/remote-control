import type {
  ConnectionListener,
  ConnectionState,
  RemoteKey,
  TvApp,
  TvDevice,
} from './types';

/**
 * The only surface the UI uses to talk to a TV.
 * Discovery, pairing, TLS and protobuf details live behind this interface.
 */
export interface TvRemote {
  /** Current connection state. */
  getState(): ConnectionState;

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: ConnectionListener): () => void;

  /** Search the local network for TVs. */
  discover(): Promise<TvDevice[]>;

  /** Connect to a TV; moves to `pairing` if the TV is not paired yet. */
  connect(device: TvDevice): Promise<void>;

  /** Finish pairing with the code shown on the TV screen. */
  submitPairingCode(code: string): Promise<void>;

  /** Send a button press to the connected TV. */
  sendKey(key: RemoteKey): Promise<void>;

  /**
   * Type text into the focused field of the TV, one press at a time
   * (digits and letters). The UI calls this on every key tap, not on submit.
   */
  sendText(text: string): Promise<void>;

  /** Ask the TV to open a streaming app. */
  openApp(app: TvApp): Promise<void>;

  /** Close the connection. */
  disconnect(): Promise<void>;
}
