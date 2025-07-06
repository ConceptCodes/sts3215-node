import { ErrorMessage } from "../utils/constants.js";

export class InvalidIdError extends RangeError {
  constructor(id: number) {
    super(ErrorMessage.INVALID_SERVO_ID.replace("{id}", id.toString()));
    this.name = "InvalidError";
  }
}

export class SerialWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SerialWriteError";
  }
}

export class InvalidPacketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPacketError";
  }
}
