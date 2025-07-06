export enum ErrorMessage {
  INVALID_SERVO_ID = "The servo id {id} is not valid",
  INVALID_PACKET_HEADER = "Header bytes does not match",
  MISMATCH_SERVO_ID = "The servo id {id} does not match the expected value",
  INVALID_PACKET_LENGTH = "Declared length byte does not match actual length",
  INVALID_COMMAND = "The command is not valid",
}

export const PACKET_HEADER_BYTES = [0xff, 0xff];

/**
 *
 * Registers are divided into two areas:
 * - EEPROM Area (non-volatile): Persistent configuration registers.
 * - RAM Area (volatile): Runtime control and status registers.
 *
 * Each member represents the address of a specific register.
 *
 * @enum Register
 * @property {number} ID - Device ID register (EEPROM).
 * @property {number} BAUD_RATE - Communication baud rate register (EEPROM).
 * @property {number} RETURN_DELAY - Status return delay time register (EEPROM).
 * @property {number} MIN_ANGLE_LIMIT - Minimum angle limit register (EEPROM).
 * @property {number} MAX_ANGLE_LIMIT - Maximum angle limit register (EEPROM).
 * @property {number} TEMPERATURE_LIMIT - Maximum temperature limit register (EEPROM).
 * @property {number} VOLTAGE_LIMIT_LOW - Minimum voltage limit register (EEPROM).
 * @property {number} VOLTAGE_LIMIT_HIGH - Maximum voltage limit register (EEPROM).
 * @property {number} MAX_TORQUE - Maximum torque limit register (EEPROM).
 * @property {number} STATUS_RETURN_LEVEL - Status return level register (EEPROM).
 * @property {number} ALARM_LED - Alarm LED indicator register (EEPROM).
 * @property {number} ALARM_SHUTDOWN - Alarm shutdown condition register (EEPROM).
 * @property {number} TORQUE_ENABLE - Torque enable/disable register (RAM).
 * @property {number} LED - LED control register (RAM).
 * @property {number} GOAL_POSITION - Target position register (RAM).
 * @property {number} MOVING_SPEED - Target moving speed register (RAM).
 * @property {number} PRESENT_POSITION - Current position register (RAM).
 * @property {number} PRESENT_SPEED - Current speed register (RAM).
 * @property {number} PRESENT_LOAD - Current load register (RAM).
 * @property {number} PRESENT_VOLTAGE - Current voltage register (RAM).
 * @property {number} PRESENT_TEMPERATURE - Current temperature register (RAM).
 */
export enum STSRegister {
  // EEPROM Area (non-volatile)
  ID = 0x05,
  BAUD_RATE = 0x06,
  RETURN_DELAY = 0x07,
  MIN_ANGLE_LIMIT = 0x08,
  MAX_ANGLE_LIMIT = 0x0a,
  TEMPERATURE_LIMIT = 0x0c,
  VOLTAGE_LIMIT_LOW = 0x0d,
  VOLTAGE_LIMIT_HIGH = 0x0e,
  MAX_TORQUE = 0x0f,
  STATUS_RETURN_LEVEL = 0x10,
  ALARM_LED = 0x11,
  ALARM_SHUTDOWN = 0x12,

  // RAM Area (volatile)
  TORQUE_ENABLE = 0x18,
  LED = 0x19,
  GOAL_POSITION = 0x1a,
  MOVING_SPEED = 0x1e,
  PRESENT_POSITION = 0x38, // Updated to 0x38 for STS3215
  PRESENT_SPEED = 0x26,
  PRESENT_LOAD = 0x28,
  PRESENT_VOLTAGE = 0x2a,
  PRESENT_TEMPERATURE = 0x2b,
}
