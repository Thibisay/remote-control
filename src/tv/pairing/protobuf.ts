/**
 * Minimal protobuf wire-format helpers. The pairing messages are tiny, and
 * protobufjs' reflection needs `new Function`, which Hermes does not provide.
 */

const VARINT = 0;
const LENGTH_DELIMITED = 2;

export function encodeVarint(value: number): number[] {
  const out: number[] = [];
  let v = value;
  while (v > 0x7f) {
    out.push((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  out.push(v);
  return out;
}

function tag(field: number, wire: number): number[] {
  return encodeVarint(field * 8 + wire);
}

export function varintField(field: number, value: number): number[] {
  return [...tag(field, VARINT), ...encodeVarint(value)];
}

export function bytesField(field: number, bytes: ArrayLike<number>): number[] {
  return [...tag(field, LENGTH_DELIMITED), ...encodeVarint(bytes.length), ...Array.from(bytes)];
}

export function stringField(field: number, text: string): number[] {
  // Names used here are ASCII; encode as UTF-8 anyway.
  const bytes = Array.from(unescape(encodeURIComponent(text)), (c) => c.charCodeAt(0));
  return bytesField(field, bytes);
}

/** Prefixes a message with its length as a varint, as the TV expects on the wire. */
export function frame(message: ArrayLike<number>): Uint8Array {
  return Uint8Array.from([...encodeVarint(message.length), ...Array.from(message)]);
}

export type ParsedField = { field: number; wire: number; varint?: number; bytes?: Uint8Array };

/** Reads a varint at `pos`. Returns null if the buffer ends before it is complete. */
export function readVarint(buf: Uint8Array, pos: number): { value: number; next: number } | null {
  let value = 0;
  let shift = 0;
  let i = pos;
  while (i < buf.length) {
    const byte = buf[i++];
    value += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) return { value, next: i };
    shift += 7;
    if (shift > 49) throw new Error('Varint demasiado largo');
  }
  return null;
}

export function parseFields(buf: Uint8Array): ParsedField[] {
  const fields: ParsedField[] = [];
  let pos = 0;
  while (pos < buf.length) {
    const key = readVarint(buf, pos);
    if (!key) throw new Error('Mensaje truncado');
    pos = key.next;
    const field = Math.floor(key.value / 8);
    const wire = key.value % 8;
    if (wire === VARINT) {
      const v = readVarint(buf, pos);
      if (!v) throw new Error('Mensaje truncado');
      pos = v.next;
      fields.push({ field, wire, varint: v.value });
    } else if (wire === LENGTH_DELIMITED) {
      const len = readVarint(buf, pos);
      if (!len) throw new Error('Mensaje truncado');
      pos = len.next;
      if (pos + len.value > buf.length) throw new Error('Mensaje truncado');
      fields.push({ field, wire, bytes: buf.slice(pos, pos + len.value) });
      pos += len.value;
    } else {
      throw new Error(`Tipo de campo no soportado: ${wire}`);
    }
  }
  return fields;
}
