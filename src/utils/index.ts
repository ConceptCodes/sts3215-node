import { Command } from "../core/commands";
import { InvalidPacketError } from "../core/errors";
import { createLogger } from "../core/logger.js";
import { ErrorMessage, PACKET_HEADER_BYTES } from "./constants";

const logger = createLogger("UTILS");

/**
 * Validates that the id is within range 0 <= n <= 253
 * @param id {number} - servo id number
 * @returns {boolean}
 */
export function validId(id: number): boolean {
  const isValid = id >= 0 && id <= 253;
  logger.debug("Validating servo ID", { id, isValid });
  return isValid;
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
  const bytes = [value & 0xff, (value >> 8) & 0xff];
  logger.debug("Converting to little-endian bytes", {
    value,
    hex: `0x${value.toString(16).padStart(4, "0")}`,
    bytes: bytes.map((b) => `0x${b.toString(16).padStart(2, "0")}`).join(" "),
  });
  return bytes;
}

/**
 * Parses a servo response packet by extracting the data payload.
 * Removes the header (first 5 bytes) and checksum (last byte) from the response.
 *
 * @param res - The raw response packet as a Uint8Array
 * @returns The data payload portion of the response packet
 *
 * @example
 * ```typescript
 * const response = new Uint8Array([0xFF, 0xFF, 0x01, 0x04, 0x00, 0x2A, 0x01, 0xCC]);
 * const data = parseResponse(response);
 * // data = Uint8Array([0x2A, 0x01])
 * ```
 */
export function parseResponse(res: Uint8Array) {
  const parsed = res.slice(5, -1);
  logger.debug("Parsing response packet", {
    originalLength: res.length,
    parsedLength: parsed.length,
    original: Array.from(res)
      .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
      .join(" "),
    parsed: Array.from(parsed)
      .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
      .join(" "),
  });
  return parsed;
}

/**
 * Validates a servo communication packet structure and content.
 * Checks packet header, servo ID, length, and command validity.
 *
 * @param pkt - The packet data as a Uint8Array
 * @param id - The expected servo ID (0-253)
 * @param expectedCmd - The expected command type (defaults to READ_DATA)
 * @returns True if the packet is valid
 * @throws {InvalidPacketError} When packet validation fails
 *
 * @example
 * ```typescript
 * const packet = new Uint8Array([0xFF, 0xFF, 0x01, 0x04, 0x02, 0x2A, 0x01, 0xCC]);
 * const isValid = validPacket(packet, 1, Command.READ_DATA);
 * // isValid = true (if packet structure is correct)
 * ```
 */
export function validPacket(
  pkt: Uint8Array,
  id: number,
  expectedCmd: Command = Command.READ_DATA
): boolean {
  logger.debug("Validating packet", {
    id,
    expectedCmd: Command[expectedCmd],
    packetLength: pkt.length,
    packet: Array.from(pkt)
      .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
      .join(" "),
  });

  const declaredLength = pkt[3];
  const expectedLength = pkt.length - 2; // exclude 2-byte header

  // Validate header
  if (pkt[0] !== PACKET_HEADER_BYTES[0] || pkt[1] !== PACKET_HEADER_BYTES[1]) {
    logger.error(
      "Invalid packet header",
      new InvalidPacketError(ErrorMessage.INVALID_PACKET_HEADER),
      {
        id,
        expectedHeader: PACKET_HEADER_BYTES.map(
          (b) => `0x${b.toString(16).padStart(2, "0")}`
        ).join(" "),
        actualHeader: [pkt[0]!, pkt[1]!]
          .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
          .join(" "),
      }
    );
    throw new InvalidPacketError(ErrorMessage.INVALID_PACKET_HEADER);
  }

  // Validate servo ID
  if (pkt[2] !== id) {
    logger.error(
      "Servo ID mismatch",
      new InvalidPacketError(ErrorMessage.MISMATCH_SERVO_ID),
      {
        expectedId: id,
        actualId: pkt[2],
      }
    );
    throw new InvalidPacketError(ErrorMessage.MISMATCH_SERVO_ID);
  }

  // Validate length
  if (declaredLength != expectedLength) {
    logger.error(
      "Packet length mismatch",
      new InvalidPacketError(ErrorMessage.INVALID_PACKET_LENGTH),
      {
        id,
        declaredLength,
        expectedLength,
        actualPacketLength: pkt.length,
      }
    );
    throw new InvalidPacketError(ErrorMessage.INVALID_PACKET_LENGTH);
  }

  // Validate command
  if (pkt[4] != expectedCmd) {
    logger.error(
      "Command mismatch",
      new InvalidPacketError(ErrorMessage.INVALID_COMMAND),
      {
        id,
        expectedCmd: Command[expectedCmd],
        actualCmd:
          pkt[4] !== undefined && Command[pkt[4]!]
            ? Command[pkt[4]!]
            : `Unknown(${pkt[4]})`,
      }
    );
    throw new InvalidPacketError(ErrorMessage.INVALID_COMMAND);
  }

  logger.debug("Packet validation successful", {
    id,
    cmd: Command[expectedCmd],
  });
  return true;
}
