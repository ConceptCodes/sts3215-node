import { Command } from "../core/commands";

export type BuildPacketFn<C extends Command = Command> = {
  id: number;
  cmd: C;
  params: CommandParamMap[C];
};

export type GenerateChecksumFn = {
  id: number;
  length: number;
  paramBytes: number[];
  cmd: Command;
};

export type PingParams = never;
export type ReadDataParams = {
  register: number;
  length: number; // number of bytes to read (1 or 2)
};
export type WriteDataParams = {
  register: number;
  data: number[]; // must be 1 or 2 bytes depending on register
};
export type RegWriteParams = WriteDataParams;
export type ActionParams = never;
export type ResetParams = never;
export type SyncWriteParams = {
  register: number;
  dataLength: number; // bytes per servo
  entries: Array<{
    id: number;
    data: number[]; // must match dataLength
  }>;
};
export type BulkReadParams = Array<{
  id: number;
  register: number;
  length: number; // bytes to read
}>;

export type ParamSchema =
  | PingParams
  | ReadDataParams
  | WriteDataParams
  | RegWriteParams
  | ActionParams
  | ResetParams
  | SyncWriteParams
  | BulkReadParams;

export type CommandParamMap = {
  [Command.PING]: PingParams;
  [Command.READ_DATA]: ReadDataParams;
  [Command.BULK_READ]: BulkReadParams;
  [Command.WRITE_DATA]: WriteDataParams;
  [Command.REG_WRITE]: RegWriteParams;
  [Command.SYNC_WRITE]: SyncWriteParams;
  [Command.ACTION]: ActionParams;
  [Command.RESET]: ResetParams;
};

export type MoveToArgs = {
  position: number;
};
