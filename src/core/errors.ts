import { ErrorMessage } from "../utils/constants";

export class InvalidIdError extends RangeError {
  constructor(id: number) {
    super(ErrorMessage.INVALID_SERVO_ID.replace("{id}", id.toString()));
  }
}

export class SerialWriteError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidPacketError extends Error {
  constructor(message: string) {
    super(message);
  }
}
