import type { TvApp } from '../types';

/**
 * Deep links sent in RemoteAppLinkLaunchRequest.
 * YouTube, Netflix, Prime Video and Disney+ are the ones Home Assistant documents
 * for this protocol. HBO Max and XuperTV have no verified link yet, so they are
 * null and openApp() reports it instead of guessing.
 */
export const APP_LINKS: Record<TvApp, string | null> = {
  youtube: 'https://www.youtube.com',
  netflix: 'https://www.netflix.com/title',
  prime: 'https://app.primevideo.com',
  disney: 'https://www.disneyplus.com',
  hbo: null,
  xupertv: null,
};
