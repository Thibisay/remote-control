import type { RemoteKey } from '../types';

/** Android KeyEvent codes (RemoteKeyCode in remotemessage.proto). */
export const KEYCODE = {
  HOME: 3,
  BACK: 4,
  DPAD_UP: 19,
  DPAD_DOWN: 20,
  DPAD_LEFT: 21,
  DPAD_RIGHT: 22,
  DPAD_CENTER: 23,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  POWER: 26,
  ENTER: 66,
  DEL: 67,
  VOLUME_MUTE: 164,
  CHANNEL_UP: 166,
  CHANNEL_DOWN: 167,
} as const;

export const KEY_FOR: Record<RemoteKey, number> = {
  up: KEYCODE.DPAD_UP,
  down: KEYCODE.DPAD_DOWN,
  left: KEYCODE.DPAD_LEFT,
  right: KEYCODE.DPAD_RIGHT,
  ok: KEYCODE.DPAD_CENTER,
  back: KEYCODE.BACK,
  home: KEYCODE.HOME,
  volumeUp: KEYCODE.VOLUME_UP,
  volumeDown: KEYCODE.VOLUME_DOWN,
  mute: KEYCODE.VOLUME_MUTE,
  power: KEYCODE.POWER,
  channelUp: KEYCODE.CHANNEL_UP,
  channelDown: KEYCODE.CHANNEL_DOWN,
  backspace: KEYCODE.DEL,
  enter: KEYCODE.ENTER,
};

const PUNCTUATION: Record<string, number> = {
  ' ': 62, // SPACE
  ',': 55, // COMMA
  '.': 56, // PERIOD
  '-': 69, // MINUS
  '=': 70, // EQUALS
  '/': 76, // SLASH
  '@': 77, // AT
  '+': 81, // PLUS
};

/**
 * KeyEvent code for a typed character, or null if it has none here.
 * Letters are sent as lowercase: the key message carries no Shift state.
 */
export function keyCodeForChar(char: string): number | null {
  const c = char.toLowerCase();
  if (c >= 'a' && c <= 'z') return 29 + (c.charCodeAt(0) - 97); // KEYCODE_A = 29
  if (c >= '0' && c <= '9') return 7 + (c.charCodeAt(0) - 48); // KEYCODE_0 = 7
  return PUNCTUATION[c] ?? null;
}
