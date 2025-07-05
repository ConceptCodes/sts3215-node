import type { MoveToArgs, WriteFn } from "../@types";
import { Command } from "../core/commands";
import { InvalidIdError } from "../core/errors";
import { buildPacket } from "../core/packet";
import { toLittleEndianBytes, validId } from "../utils";
import { Register } from "../utils/constants";

export class Servo {
  private id: number;
  private writeFn: WriteFn;

  constructor(id: number, writeFn: WriteFn) {
    if (!validId(id)) throw new InvalidIdError(id);
    this.id = id;
    this.writeFn = writeFn;
  }

  public async setID(id: number): Promise<void> {
    const pkt = buildPacket({
      id,
      cmd: Command.WRITE_DATA,
      params: {
        register: Register.ID,
        data: [id],
      },
    });
    await this.writeFn(pkt);
  }

  public async moveTo(args: MoveToArgs): Promise<void> {
    const { position } = args;
    const pkt = buildPacket({
      id: this.id,
      cmd: Command.WRITE_DATA,
      params: {
        register: Register.GOAL_POSITION,
        data: toLittleEndianBytes(position),
      },
    });
    await this.writeFn(pkt);
  }

  public async readPosition(): Promise<void> {
    const pkt = buildPacket({
      id: this.id,
      cmd: Command.READ_DATA,
      params: {
        register: Register.PRESENT_POSITION,
        length: 2,
      },
    });
  }

  public async setLED(on: boolean): Promise<void> {
    const pkt = buildPacket({
      id: this.id,
      cmd: Command.WRITE_DATA,
      params: {
        register: Register.LED,
        data: [on ? 1 : 0],
      },
    });

    await this.writeFn(pkt);
  }
}
