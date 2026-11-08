import { useSyncExternalStore } from 'react';

import type { TvRemote } from './TvRemote';
import type { ConnectionState } from './types';

/** Re-renders the component whenever the connection state changes. */
export function useTvState(remote: TvRemote): ConnectionState {
  return useSyncExternalStore(remote.subscribe, remote.getState);
}
