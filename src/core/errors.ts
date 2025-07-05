import { ErrorMessage } from "../utils/constants";

export class InvalidIdError extends RangeError {
  constructor(id: number) {
    super(ErrorMessage.INVALID_SERVO_ID.replace("{id}", id.toString()));
  }
}
