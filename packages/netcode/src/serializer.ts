import { encode, decode } from "@msgpack/msgpack";
import type { ClientMessage, ServerMessage } from "@my-beat/shared-types/messages";

export function encodeMessage(msg: ClientMessage | ServerMessage): Uint8Array {
  return encode(msg);
}

export function decodeClientMessage(data: ArrayBuffer | Uint8Array): ClientMessage {
  return decode(data instanceof ArrayBuffer ? new Uint8Array(data) : data) as ClientMessage;
}

export function decodeServerMessage(data: ArrayBuffer | Uint8Array): ServerMessage {
  return decode(data instanceof ArrayBuffer ? new Uint8Array(data) : data) as ServerMessage;
}
