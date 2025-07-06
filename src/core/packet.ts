import type {
  BuildPacketFn,
  CommandParamMap,
  GenerateChecksumFn,
} from "../@types";
import { validId } from "../utils";
import { PACKET_HEADER_BYTES } from "../utils/constants";
import { Command } from "./commands";
import { InvalidIdError } from "./errors";

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
