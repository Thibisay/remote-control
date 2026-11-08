import * as Crypto from 'expo-crypto';

/**
 * RSA key generation with native BigInt.
 *
 * node-forge generates keys with its own big-integer class written in plain
 * JavaScript. Hermes has no JIT, so that takes minutes on a phone and freezes the
 * UI. Hermes implements BigInt natively, which makes this a matter of seconds.
 * Randomness comes from the system (expo-crypto), never Math.random.
 */

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const E = BigInt(65537);

export type RsaKeyParts = {
  n: string;
  e: string;
  d: string;
  p: string;
  q: string;
  dP: string;
  dQ: string;
  qInv: string;
};

const SMALL_PRIMES: bigint[] = (() => {
  const primes: bigint[] = [];
  for (let i = 3; primes.length < 300; i += 2) {
    let prime = true;
    for (const p of primes) {
      if (Number(p) * Number(p) > i) break;
      if (i % Number(p) === 0) {
        prime = false;
        break;
      }
    }
    if (prime) primes.push(BigInt(i));
  }
  return primes;
})();

function randomBits(bits: number): bigint {
  const bytes = Crypto.getRandomBytes(Math.ceil(bits / 8));
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  const value = BigInt('0x' + hex);
  const extra = bytes.length * 8 - bits;
  return extra > 0 ? value >> BigInt(extra) : value;
}

function bitLength(x: bigint): number {
  return x.toString(2).length;
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = ONE;
  let b = base % mod;
  let e = exp;
  while (e > ZERO) {
    if ((e & ONE) === ONE) result = (result * b) % mod;
    e >>= ONE;
    b = (b * b) % mod;
  }
  return result;
}

function modInverse(a: bigint, m: bigint): bigint {
  let [oldR, r] = [((a % m) + m) % m, m];
  let [oldS, s] = [ONE, ZERO];
  while (r !== ZERO) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  if (oldR !== ONE) throw new Error('No hay inverso modular');
  return ((oldS % m) + m) % m;
}

/** One Miller-Rabin round with a random base. */
function millerRabinRound(n: bigint, d: bigint, s: number): boolean {
  const a = (randomBits(bitLength(n)) % (n - BigInt(3))) + TWO;
  let x = modPow(a, d, n);
  if (x === ONE || x === n - ONE) return true;
  for (let i = 1; i < s; i++) {
    x = (x * x) % n;
    if (x === n - ONE) return true;
    if (x === ONE) return false;
  }
  return false;
}

function isProbablePrime(n: bigint, rounds: number): boolean {
  let d = n - ONE;
  let s = 0;
  while ((d & ONE) === ZERO) {
    d >>= ONE;
    s++;
  }
  for (let i = 0; i < rounds; i++) {
    if (!millerRabinRound(n, d, s)) return false;
  }
  return true;
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function generatePrime(bits: number): Promise<bigint> {
  const top = (ONE << BigInt(bits - 1)) | (ONE << BigInt(bits - 2));
  for (;;) {
    // Top two bits set so that p*q has exactly 2*bits bits; odd.
    const candidate = randomBits(bits) | top | ONE;
    if (SMALL_PRIMES.some((p) => candidate % p === ZERO)) continue;
    if ((candidate - ONE) % E === ZERO) continue;
    // Give the UI thread a chance between expensive tests.
    await tick();
    // Cheap first round rejects almost every composite before the full test.
    if (!isProbablePrime(candidate, 1)) continue;
    if (isProbablePrime(candidate, 11)) return candidate;
  }
}

const hex = (x: bigint) => x.toString(16);

/** Generates an RSA key (e = 65537) and checks it before returning. */
export async function generateRsaKey(bits: number = 2048): Promise<RsaKeyParts> {
  for (;;) {
    const p = await generatePrime(bits / 2);
    const q = await generatePrime(bits / 2);
    if (p === q) continue;
    const n = p * q;
    if (bitLength(n) !== bits) continue;
    // p and q must not be close to each other.
    const diff = p > q ? p - q : q - p;
    if (diff < ONE << BigInt(bits / 2 - 100)) continue;

    const [hi, lo] = p > q ? [p, q] : [q, p];
    const phi = (hi - ONE) * (lo - ONE);
    const d = modInverse(E, phi);
    const dP = d % (hi - ONE);
    const dQ = d % (lo - ONE);
    const qInv = modInverse(lo, hi);

    // Self-test: encrypting and decrypting a random value must give it back.
    const m = randomBits(bits - 8) + TWO;
    if (modPow(modPow(m, E, n), d, n) !== m) continue;

    return { n: hex(n), e: hex(E), d: hex(d), p: hex(hi), q: hex(lo), dP: hex(dP), dQ: hex(dQ), qInv: hex(qInv) };
  }
}
