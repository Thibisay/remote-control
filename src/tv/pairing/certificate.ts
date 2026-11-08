import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import forge from 'node-forge';

/** Client identity the TV remembers after pairing. */
export type ClientIdentity = {
  /** X.509 certificate, PEM. */
  certPem: string;
  /** Private key, PKCS#8 PEM (the format react-native-tcp-socket needs). */
  keyPem: string;
};

const CERT_KEY = 'tv.client.cert';
const KEY_KEY = 'tv.client.key';

function randomBinary(bytes: number): string {
  return String.fromCharCode(...Crypto.getRandomBytes(bytes));
}

/** RSA modulus and exponent as upper-case hex. */
export function publicPartsFromCert(certPem: string): { modulusHex: string; exponentHex: string } {
  const cert = forge.pki.certificateFromPem(certPem);
  const key = cert.publicKey as forge.pki.rsa.PublicKey;
  return { modulusHex: key.n.toString(16).toUpperCase(), exponentHex: key.e.toString(16).toUpperCase() };
}

/** Generates an RSA-2048 key and a self-signed certificate. Takes a few seconds on a phone. */
export async function generateIdentity(): Promise<ClientIdentity> {
  // Seed node-forge's PRNG with system randomness instead of Math.random.
  // `collect` exists at runtime but is missing from @types/node-forge.
  (forge.random as unknown as { collect(bytes: string): void }).collect(randomBinary(128));

  const keys = await new Promise<forge.pki.rsa.KeyPair>((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 }, (err, pair) =>
      err ? reject(err) : resolve(pair),
    );
  });

  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01' + forge.util.bytesToHex(randomBinary(8));
  const now = Date.now();
  cert.validity.notBefore = new Date(now - 24 * 3600 * 1000);
  cert.validity.notAfter = new Date(now + 20 * 365 * 24 * 3600 * 1000);
  const attrs = [{ name: 'commonName', value: 'atvremote' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const pkcs8 = forge.pki.wrapRsaPrivateKey(forge.pki.privateKeyToAsn1(keys.privateKey));
  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyInfoToPem(pkcs8),
  };
}

export async function loadIdentity(): Promise<ClientIdentity | null> {
  const [certPem, keyPem] = await Promise.all([
    SecureStore.getItemAsync(CERT_KEY),
    SecureStore.getItemAsync(KEY_KEY),
  ]);
  return certPem && keyPem ? { certPem, keyPem } : null;
}

export async function saveIdentity(identity: ClientIdentity): Promise<void> {
  await SecureStore.setItemAsync(CERT_KEY, identity.certPem);
  await SecureStore.setItemAsync(KEY_KEY, identity.keyPem);
}

/** Existing identity, or a new one saved for next time. */
export async function getOrCreateIdentity(): Promise<ClientIdentity> {
  const existing = await loadIdentity();
  if (existing) return existing;
  const created = await generateIdentity();
  await saveIdentity(created);
  return created;
}
