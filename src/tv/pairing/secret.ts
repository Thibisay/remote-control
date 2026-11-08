import forge from 'node-forge';

export class PairingError extends Error {}

/** "0x010001" / "10001" -> "010001": no prefix, upper case, even length. */
function normalizeHex(hex: string): string {
  const clean = hex.replace(/^0x/i, '').toUpperCase();
  return clean.length % 2 === 0 ? clean : `0${clean}`;
}

/**
 * Secret sent to the TV: SHA-256 over, in order, the client modulus, client
 * exponent, server modulus, server exponent (each as big-endian bytes) and the
 * last 4 hex characters of the code shown on the TV. The first byte of the
 * digest must equal the first 2 characters of the code; otherwise the code
 * was mistyped. (tronikos/androidtvremote2 pairing.py, Aymkdn protocol notes.)
 */
export function computeSecret(
  client: { modulusHex: string; exponentHex: string },
  server: { modulusHex: string; exponentHex: string },
  code: string,
): Uint8Array {
  if (!/^[0-9A-Fa-f]{6}$/.test(code)) {
    throw new PairingError('El código debe tener 6 caracteres (0-9, A-F)');
  }
  const md = forge.md.sha256.create();
  for (const hex of [client.modulusHex, client.exponentHex, server.modulusHex, server.exponentHex]) {
    md.update(forge.util.hexToBytes(normalizeHex(hex)));
  }
  md.update(forge.util.hexToBytes(code.slice(2)));
  const digest = Uint8Array.from(md.digest().getBytes(), (c) => c.charCodeAt(0));
  if (digest[0] !== parseInt(code.slice(0, 2), 16)) {
    throw new PairingError('Código incorrecto');
  }
  return digest;
}
