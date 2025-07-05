export enum Command {
  /**
   * Test servo connection (no params)
   */
  PING = 0x01,
  /**
   * 	Read register or sensor data
   */
  READ_DATA = 0x02,
  /**
   * Write to register (e.g., angle limit, LED)
   */
  WRITE_DATA = 0x03,
  /**
   * Prepare a deferred write
   */
  REG_WRITE = 0x04,
  /**
   * Execute all deferred writes
   */
  ACTION = 0x05,
  /**
   * Reset to factory settings
   */
  RESET = 0x06,
  /**
   * 	Write to multiple servos at once
   */
  SYNC_WRITE = 0x83,
  /**
   * Read from multiple servos at once
   */
  BULK_READ = 0x92,
}
