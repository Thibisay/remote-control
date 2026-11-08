import { bytesField, parseFields, stringField, varintField } from '../pairing/protobuf';

/**
 * RemoteMessage (remotemessage.proto, `package remote`) from louis49/androidtv-remote,
 * cross-checked with tronikos/androidtvremote2 and the Aymkdn protocol notes.
 *
 * RemoteMessage: remote_configure=1, remote_set_active=2, remote_error=3,
 *   remote_ping_request=8, remote_ping_response=9, remote_key_inject=10,
 *   remote_start=40, remote_app_link_launch_request=90.
 */
const F = {
  configure: 1,
  setActive: 2,
  error: 3,
  pingRequest: 8,
  pingResponse: 9,
  keyInject: 10,
  start: 40,
  appLink: 90,
} as const;

/** RemoteDirection: START_LONG = 1, END_LONG = 2, SHORT = 3. */
const DIRECTION_SHORT = 3;

/** Feature bits we offer: KEY(2) IME(4) 8 POWER(32) VOLUME(64) APP_LINK(512) = 622, as the reference clients do. */
export const OUR_FEATURES = 622;

export function buildConfigure(features: number): number[] {
  // RemoteConfigure { code1 = 1, device_info = 2 }
  // RemoteDeviceInfo { model = 1, vendor = 2, unknown1 = 3, unknown2 = 4, package_name = 5, app_version = 6 }
  const deviceInfo = [
    ...stringField(1, 'Android'),
    ...stringField(2, 'Android'),
    ...varintField(3, 1),
    ...stringField(4, '1'),
    ...stringField(5, 'atvremote'),
    ...stringField(6, '1.0.0'),
  ];
  return bytesField(F.configure, [...varintField(1, features), ...bytesField(2, deviceInfo)]);
}

export function buildSetActive(active: number): number[] {
  return bytesField(F.setActive, varintField(1, active));
}

export function buildPingResponse(val1: number): number[] {
  return bytesField(F.pingResponse, varintField(1, val1));
}

export function buildKeyInject(keyCode: number): number[] {
  // RemoteKeyInject { key_code = 1, direction = 2 }
  return bytesField(F.keyInject, [...varintField(1, keyCode), ...varintField(2, DIRECTION_SHORT)]);
}

export function buildAppLink(link: string): number[] {
  // RemoteAppLinkLaunchRequest { app_link = 1 }
  return bytesField(F.appLink, stringField(1, link));
}

export type RemoteEvent =
  | { type: 'configure'; features: number }
  | { type: 'setActive' }
  | { type: 'ping'; val1: number }
  | { type: 'start'; started: boolean }
  | { type: 'error' }
  | { type: 'other' };

function firstVarint(bytes: Uint8Array | undefined, field: number): number {
  if (!bytes) return 0;
  return parseFields(bytes).find((f) => f.field === field && f.varint !== undefined)?.varint ?? 0;
}

export function parseRemoteMessage(bytes: Uint8Array): RemoteEvent {
  for (const f of parseFields(bytes)) {
    if (f.wire !== 2) continue;
    switch (f.field) {
      case F.configure:
        return { type: 'configure', features: firstVarint(f.bytes, 1) };
      case F.setActive:
        return { type: 'setActive' };
      case F.pingRequest:
        return { type: 'ping', val1: firstVarint(f.bytes, 1) };
      case F.start:
        return { type: 'start', started: firstVarint(f.bytes, 1) === 1 };
      case F.error:
        return { type: 'error' };
    }
  }
  return { type: 'other' };
}
