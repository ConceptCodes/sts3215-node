import type { MoveToArgs } from "../@types";
import { Command } from "../core/commands";
import { InvalidIdError } from "../core/errors";
import { createLogger } from "../core/logger.js";
import { buildPacket } from "../core/packet";
import type SerialTransport from "../transport/serial";
import { parseResponse, toLittleEndianBytes, validId } from "../utils";
import { STSRegister } from "../utils/constants";

const logger = createLogger("SERVO");

export class Servo {
  private id: number;
  private transport: SerialTransport;

  constructor(id: number, transport: SerialTransport) {
    logger.info("Creating servo instance", { id });

    if (!validId(id)) {
      logger.error("Invalid servo ID provided", new InvalidIdError(id), { id });
      throw new InvalidIdError(id);
    }

    this.id = id;
    this.transport = transport;

    logger.debug("Servo instance created successfully", { id });
  }

  public async setID(id: number): Promise<void> {
    logger.info("Setting servo ID", { currentId: this.id, newId: id });

    try {
      const pkt = buildPacket({
        id,
        cmd: Command.WRITE_DATA,
        params: {
          register: STSRegister.ID,
          data: [id],
        },
      });

      await this.transport.write(pkt);
      logger.info("Servo ID set successfully", { oldId: this.id, newId: id });
    } catch (error) {
      logger.error("Failed to set servo ID", error as Error, {
        currentId: this.id,
        newId: id,
      });
      throw error;
    }
  }

  public async moveTo(args: MoveToArgs): Promise<void> {
    const { position } = args;
    logger.info("Moving servo to position", { servoId: this.id, position });

    try {
      const pkt = buildPacket({
        id: this.id,
        cmd: Command.WRITE_DATA,
        params: {
          register: STSRegister.GOAL_POSITION,
          data: toLittleEndianBytes(position),
        },
      });

      await this.transport.write(pkt);
      logger.info("Move command sent successfully", {
        servoId: this.id,
        position,
      });
    } catch (error) {
      logger.error("Failed to move servo", error as Error, {
        servoId: this.id,
        position,
      });
      throw error;
    }
  }

  public async readPosition(): Promise<number> {
    logger.debug("Reading servo position", { servoId: this.id });

    try {
      const pkt = buildPacket({
        id: this.id,
        cmd: Command.READ_DATA,
        params: {
          register: STSRegister.PRESENT_POSITION,
          length: 2,
        },
      });

      await this.transport.write(pkt);
      let response = await this.transport.waitForResponse(
        this.id,
        Command.READ_DATA,
        500
      );

      response = parseResponse(response);
      const low = response[0];
      const high = response[1];
      const position = low! + (high! << 8);

      logger.debug("Position read successfully", {
        servoId: this.id,
        position,
        rawBytes: [low, high],
      });
      return position;
    } catch (error) {
      logger.error("Failed to read servo position", error as Error, {
        servoId: this.id,
      });
      throw error;
    }
  }

  public async setLED(on: boolean): Promise<void> {
    logger.debug("Setting servo LED", { servoId: this.id, on });

    try {
      const pkt = buildPacket({
        id: this.id,
        cmd: Command.WRITE_DATA,
        params: {
          register: STSRegister.LED,
          data: [on ? 1 : 0],
        },
      });

      await this.transport.write(pkt);
      logger.debug("LED state set successfully", { servoId: this.id, on });
    } catch (error) {
      logger.error("Failed to set LED state", error as Error, {
        servoId: this.id,
        on,
      });
      throw error;
    }
  }
}
