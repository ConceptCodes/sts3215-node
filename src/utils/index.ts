import { Command } from "../core/commands";
import { InvalidPacketError } from "../core/errors";
import { ErrorMessage, PACKET_HEADER_BYTES } from "./constants";

/**
 * Validates that the id is within range 0 <= n <= 253
 * @param id {number} - servo id number
 * @returns {boolean}
 */
export function validId(id: number): boolean {
  return id >= 0 && id <= 253;
}

/**
 * Converts a 16-bit number to a little-endian byte array.
 *
 * @param value - The 16-bit number to convert.
 * @returns An array of two numbers representing the little-endian byte order of the input value.
 *
 * @example
 * ```typescript
 * const bytes = toLittleEndianBytes(0x1234);
 * // bytes = [0x34, 0x12]
 * ```
 */
export function toLittleEndianBytes(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff];
}

export function parseResponse(res: Uint8Array) {
  return res.slice(5, -1);
}

export function validPacket(
  pkt: Uint8Array,
  id: number,
  expectedCmd: Command = Command.READ_DATA
): boolean {
  const declaredLength = pkt[3];
  const expectedLength = pkt.length - 2; // exclude 2-byte header

  if (pkt[0] !== PACKET_HEADER_BYTES[0] || pkt[1] !== PACKET_HEADER_BYTES[1])
    throw new InvalidPacketError(ErrorMessage.INVALID_PACKET_HEADER);
  if (pkt[2] !== id)
    throw new InvalidPacketError(ErrorMessage.MISMATCH_SERVO_ID);
  if (declaredLength != expectedLength)
    throw new InvalidPacketError(ErrorMessage.INVALID_PACKET_LENGTH);
  if (pkt[4] != expectedCmd)
    throw new InvalidPacketError(ErrorMessage.INVALID_COMMAND);
  return true;
}
