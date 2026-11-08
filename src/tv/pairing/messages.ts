import { bytesField, parseFields, stringField, varintField } from './protobuf';

/**
 * Pairing messages (pairingmessage.proto, `package pairing`), taken from
 * louis49/androidtv-remote and cross-checked with tronikos/androidtvremote2.
 *
 * PairingMessage: protocol_version=1, status=2,
 *   pairing_request=10, pairing_request_ack=11, pairing_option=20,
 *   pairing_configuration=30, pairing_configuration_ack=31,
 *   pairing_secret=40, pairing_secret_ack=41.
 */
const PROTOCOL_VERSION = 2;
const STATUS_OK = 200;
const ROLE_TYPE_INPUT = 1;
const ENCODING_TYPE_HEXADECIMAL = 3;
const SYMBOL_LENGTH = 6;

const F = {
  request: 10,
  requestAck: 11,
  option: 20,
  configuration: 30,
  configurationAck: 31,
  secret: 40,
  secretAck: 41,
} as const;

function outer(inner: number[]): number[] {
  return [...varintField(1, PROTOCOL_VERSION), ...varintField(2, STATUS_OK), ...inner];
}

/** PairingEncoding { type = 1, symbol_length = 2 } */
const hexEncoding = [
  ...varintField(1, ENCODING_TYPE_HEXADECIMAL),
  ...varintField(2, SYMBOL_LENGTH),
];

export function buildPairingRequest(serviceName: string, clientName: string): number[] {
  // PairingRequest { service_name = 1, client_name = 2 }
  const body = [...stringField(1, serviceName), ...stringField(2, clientName)];
  return outer(bytesField(F.request, body));
}

export function buildPairingOption(): number[] {
  // PairingOption { input_encodings = 1 (repeated), preferred_role = 3 }
  const body = [...bytesField(1, hexEncoding), ...varintField(3, ROLE_TYPE_INPUT)];
  return outer(bytesField(F.option, body));
}

export function buildPairingConfiguration(): number[] {
  // PairingConfiguration { encoding = 1, client_role = 2 }
  const body = [...bytesField(1, hexEncoding), ...varintField(2, ROLE_TYPE_INPUT)];
  return outer(bytesField(F.configuration, body));
}

export function buildPairingSecret(secret: Uint8Array): number[] {
  // PairingSecret { secret = 1 }
  return outer(bytesField(F.secret, bytesField(1, secret)));
}

export type PairingKind =
  | 'requestAck'
  | 'option'
  | 'configurationAck'
  | 'secretAck'
  | 'unknown';

export type PairingReply = { status: number; kind: PairingKind };

export function parsePairingMessage(bytes: Uint8Array): PairingReply {
  let status = 0;
  let kind: PairingKind = 'unknown';
  for (const f of parseFields(bytes)) {
    if (f.field === 2 && f.varint !== undefined) status = f.varint;
    else if (f.field === F.requestAck) kind = 'requestAck';
    else if (f.field === F.option) kind = 'option';
    else if (f.field === F.configurationAck) kind = 'configurationAck';
    else if (f.field === F.secretAck) kind = 'secretAck';
  }
  return { status, kind };
}

export const PAIRING_STATUS_OK = STATUS_OK;
