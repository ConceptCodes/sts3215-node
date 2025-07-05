import type { CommandParamMap } from "../@types";
import { Command } from "../core/commands";

/**
 * Validates that the id is within range 0 <= n <= 253
 * @param id {number} - servo id number
 * @returns {boolean}
 */
export function validId(id: number): boolean {
  return id >= 0 && id <= 253;
}

export const ParamEncoders: {
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

export function toLittleEndianBytes(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff];
}
