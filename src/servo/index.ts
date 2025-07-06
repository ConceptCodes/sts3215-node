import type { MoveToArgs } from "../@types";
import { Command } from "../core/commands";
import { InvalidIdError } from "../core/errors";
import { buildPacket } from "../core/packet";
import type SerialTransport from "../transport/serial";
import { parseResponse, toLittleEndianBytes, validId } from "../utils";
import { STSRegister } from "../utils/constants";

export class Servo {
  private id: number;
  private transport: SerialTransport;

  constructor(id: number, transport: SerialTransport) {
    if (!validId(id)) throw new InvalidIdError(id);
    this.id = id;
    this.transport = transport;
  }

  public async setID(id: number): Promise<void> {
    const pkt = buildPacket({
      id,
      cmd: Command.WRITE_DATA,
      params: {
        register: STSRegister.ID,
        data: [id],
      },
    });
    await this.transport.write(pkt);
  }

  public async moveTo(args: MoveToArgs): Promise<void> {
    const { position } = args;
    const pkt = buildPacket({
      id: this.id,
      cmd: Command.WRITE_DATA,
      params: {
        register: STSRegister.GOAL_POSITION,
        data: toLittleEndianBytes(position),
      },
    });
    await this.transport.write(pkt);
  }

  public async readPosition(): Promise<number> {
    const pkt = buildPacket({
      id: this.id,
      cmd: Command.READ_DATA,
      params: {
        register: STSRegister.PRESENT_POSITION,
        length: 2,
      },
    });

    await this.transport.write(pkt);
    const response = await this.transport.waitForResponse(
      this.id,
      Command.READ_DATA,
      5_00
    );
    const low = response[5];
    const high = response[6];
    return low! + (high! << 8);
  }

  public async setLED(on: boolean): Promise<void> {
    const pkt = buildPacket({
      id: this.id,
      cmd: Command.WRITE_DATA,
      params: {
        register: STSRegister.LED,
        data: [on ? 1 : 0],
      },
    });

    await this.transport.write(pkt);
  }
}
