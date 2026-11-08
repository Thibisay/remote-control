import { MockTvRemote } from './MockTvRemote';
import type { TvRemote } from './TvRemote';

/**
 * Single place that decides which TvRemote implementation the app uses.
 * Currently the fake one; the real implementation replaces it later
 * without touching the UI.
 */
export function createTvRemote(): TvRemote {
  return new MockTvRemote();
}
