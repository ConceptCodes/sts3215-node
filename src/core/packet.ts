import type {
  BuildPacketFn,
  CommandParamMap,
  GenerateChecksumFn,
} from "../@types";
import { createLogger } from "./logger.js";
import { validId } from "../utils";
import { PACKET_HEADER_BYTES } from "../utils/constants";
import { Command } from "./commands";
import { InvalidIdError } from "./errors";

const logger = createLogger("PACKET");

const ParamEncoders: {
  [C in Command]: (params: CommandParamMap[C]) => number[];
} = {
  [Command.PING]: () => [],
  [Command.READ_DATA]: ({ register, length }) => [register, length],
  [Command.BULK_READ]: (params) =>
    params.flatMap(({ id, register, length }) => [id, register, length]),
  [Command.WRITE_DATA]: ({ register, data }) => [register, ...data],
  [Command.REG_WRITE]: ({ register, data }) => [register, ...data],
  [Command.SYNC_WRITE]: ({ register, dataLength, entries }) => [
    register,
    dataLength,
    ...entries.flatMap(({ id, data }) => [id, ...data]),
  ],
  [Command.ACTION]: () => [],
  [Command.RESET]: () => [],
};

/**
 * Build Packet
 *
 * Ex. [0xFA, 0xAF] [ID] [LENGTH] [COMMAND] [...PARAMS] [CHECKSUM]
 * @param args {BuildPacketFn}
 * @returns {Uint8Array}
 */
export function buildPacket(args: BuildPacketFn): Uint8Array {
  const { id, cmd, params } = args;
  logger.debug("Building packet", { id, cmd: Command[cmd], params });

  if (!validId(id)) {
    logger.error("Invalid servo ID for packet", new InvalidIdError(id), {
      id,
      cmd: Command[cmd],
    });
    throw new InvalidIdError(id);
  }

  const paramBytes = (ParamEncoders[cmd] as any)(params);
  const length = paramBytes.length + 3;

  logger.debug("Packet parameters encoded", {
    id,
    cmd: Command[cmd],
    paramBytes: paramBytes
      .map((b: number) => `0x${b.toString(16).padStart(2, "0")}`)
      .join(" "),
    length,
  });

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

  logger.debug("Packet built successfully", {
    id,
    cmd: Command[cmd],
    packetLength: pkt.length,
    packet: Array.from(pkt)
      .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
      .join(" "),
  });

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
  const checksum = 256 - (sum % 256);

  logger.debug("Generated checksum", {
    id,
    length,
    cmd: Command[cmd],
    sum,
    checksum: `0x${checksum.toString(16).padStart(2, "0")}`,
  });

  return checksum;
}
