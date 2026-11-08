import { MockTvRemote } from './MockTvRemote';
import { RealTvRemote } from './RealTvRemote';
import type { TvRemote } from './TvRemote';

/** Flip to `true` to develop the UI with the fake TV (no network). */
const USE_MOCK = false;

/**
 * Single place that decides which TvRemote implementation the app uses,
 * so the UI never changes when the implementation does.
 */
export function createTvRemote(): TvRemote {
  return USE_MOCK ? new MockTvRemote() : new RealTvRemote();
}
