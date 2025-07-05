import type { BuildPacketFn, GenerateChecksumFn } from "../@types";
import { ParamEncoders, validId } from "../utils";
import { PACKET_HEADER_BYTES } from "../utils/constants";
import { InvalidIdError } from "./errors";

/**
 * Build Packet
 *
 * Ex. [0xFA, 0xAF] [ID] [LENGTH] [COMMAND] [...PARAMS] [CHECKSUM]
 * @param args {BuildPacketFn}
 * @returns {Uint8Array}
 */
export function buildPacket(args: BuildPacketFn): Uint8Array {
  const { id, cmd, params } = args;
  if (!validId(id)) throw new InvalidIdError(id);

  const paramBytes = ParamEncoders[cmd](params);
  const length = paramBytes.length + 3;

  const bytes: number[] = [
    ...PACKET_HEADER_BYTES,
    id,
    length,
    cmd,
    ...paramBytes,
    generateChecksum({
      id,
      length,
      cmd,
      paramBytes,
    }),
  ];

  const pkt = new Uint8Array(bytes);
  return pkt;
}

/**
 * Generate Checksum
 *
 * Formula: 256 - ((ID + LENGTH + CMD + ...params) % 256)
 *
 * @param args {GenerateChecksumFn}
 * @returns
 */
function generateChecksum(args: GenerateChecksumFn): number {
  const { id, length, cmd, paramBytes } = args;
  const sum = id + length + cmd + paramBytes.reduce((a, b) => a + b, 0);
  return 256 - (sum % 256);
}
