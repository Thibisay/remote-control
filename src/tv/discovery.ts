import Zeroconf, { type Service } from 'react-native-zeroconf';

import type { TvDevice } from './types';

/** mDNS service advertised by Android TV: `_androidtvremote2._tcp`. */
const SERVICE_TYPE = 'androidtvremote2';
const SCAN_MS = 6000;

function toDevice(service: Service): TvDevice | null {
  const host = service.ipv4[0] ?? service.addresses[0];
  if (!host) return null;
  return {
    id: service.fullName || service.name,
    name: service.name,
    host,
    port: service.port,
  };
}

/**
 * Scans the local network for Android TVs for a few seconds.
 * Rejects only when nothing was found and the scan reported an error.
 */
export async function discoverTvs(timeoutMs: number = SCAN_MS): Promise<TvDevice[]> {
  const zeroconf = new Zeroconf();

  // Android 17+ may need the local-network permission; this is a no-op on older versions.
  try {
    const access = await zeroconf.checkLocalNetworkAccess({ type: SERVICE_TYPE });
    if (access === 'denied') {
      throw new Error('Permiso de red local denegado. Actívalo en los ajustes de la app.');
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Permiso')) throw e;
  }

  const found = new Map<string, TvDevice>();
  let lastError: string | null = null;

  zeroconf.on('resolved', (service) => {
    const device = toDevice(service);
    if (device) found.set(device.id, device);
  });
  zeroconf.on('error', (error) => {
    lastError = `${error.domain} ${error.code}: ${error.message}`;
  });

  try {
    zeroconf.scan({ type: SERVICE_TYPE, protocol: 'tcp', domain: 'local.' });
    await new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  } finally {
    zeroconf.stop();
    zeroconf.removeDeviceListeners();
  }

  if (found.size === 0 && lastError) {
    throw new Error(lastError);
  }
  return [...found.values()];
}
