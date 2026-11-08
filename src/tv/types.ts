/** A TV found on the local network. */
export interface TvDevice {
  /** Stable identifier (used to remember the last TV). */
  id: string;
  /** Human readable name shown in the UI. */
  name: string;
  host: string;
  port: number;
}

/** Remote buttons the UI can send. App-level names, independent of the wire protocol. */
export type RemoteKey =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'ok'
  | 'back'
  | 'home'
  | 'volumeUp'
  | 'volumeDown'
  | 'mute'
  | 'power';

/** Explicit connection states. */
export type ConnectionState =
  | { status: 'disconnected' }
  | { status: 'searching' }
  | { status: 'pairing'; device: TvDevice }
  | { status: 'connected'; device: TvDevice }
  | { status: 'error'; message: string; device?: TvDevice };

export type ConnectionStatus = ConnectionState['status'];

export type ConnectionListener = (state: ConnectionState) => void;
