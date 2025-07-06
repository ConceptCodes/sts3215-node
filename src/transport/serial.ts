import { SerialPortStream } from "@serialport/stream";
import { autoDetect } from "@serialport/bindings-cpp";
import { SerialWriteError } from "../core/errors.js";
import type { Command } from "../core/commands.js";
import { validPacket } from "../utils/index.js";
import { createLogger } from "../core/logger.js";

const logger = createLogger("SERIAL_TRANSPORT");

class SerialTransport {
  private port: SerialPortStream;
  private baudRate: number;

  constructor(port: string, baudRate: number = 1000000) {
    logger.info("Initializing serial transport", { port, baudRate });

    this.port = new SerialPortStream({
      path: port,
      baudRate,
      binding: autoDetect(),
    });
    this.baudRate = baudRate;

    this.port.on("open", () => {
      logger.info("Serial port opened successfully", { port, baudRate });
    });

    this.port.on("error", (error: Error) => {
      logger.error("Serial port error", error, { port, baudRate });
    });

    this.port.on("close", () => {
      logger.info("Serial port closed", { port });
    });
  }

  public setBaudRate(n: number): void {
    logger.debug("Setting baud rate", { oldRate: this.baudRate, newRate: n });
    this.baudRate = n;
  }

  public getBaudRate(): number {
    return this.baudRate;
  }

  public write(data: Uint8Array): Promise<void> {
    logger.debug("Writing data to serial port", {
      dataLength: data.length,
      data: Array.from(data)
        .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
        .join(" "),
      isOpen: this.port.isOpen,
    });

    if (!this.port.isOpen) {
      const error = new SerialWriteError("Serial port is not open");
      logger.error("Attempted to write to closed port", error);
      throw error;
    }

    return new Promise((resolve, reject) => {
      this.port.write(data, (err: Error | null | undefined) => {
        if (err) {
          logger.error("Failed to write data", err, {
            dataLength: data.length,
          });
          reject(new SerialWriteError(err.message));
        } else {
          logger.debug("Data written successfully", {
            dataLength: data.length,
          });
          resolve();
        }
      });
    });
  }

  public onData(callback: (data: Uint8Array) => void): void {
    logger.debug("Setting up data event listener");
    this.port.on("data", (chunk: Buffer) => {
      const data = new Uint8Array(chunk);
      logger.debug("Received data", {
        dataLength: data.length,
        data: Array.from(data)
          .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
          .join(" "),
      });
      callback(data);
    });
  }

  public waitForResponse(
    id: number,
    cmd: Command,
    timeoutMs = 500
  ): Promise<Uint8Array> {
    logger.debug("Waiting for response", { id, cmd, timeoutMs });

    if (!this.port.isOpen) {
      const error = new SerialWriteError("Serial port is not open");
      logger.error("Attempted to wait for response on closed port", error, {
        id,
        cmd,
      });
      throw error;
    }

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout;

      const onData = (chunk: Buffer) => {
        const pkt = new Uint8Array(chunk);
        logger.debug("Received response packet", {
          id,
          cmd,
          packetLength: pkt.length,
          packet: Array.from(pkt)
            .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
            .join(" "),
        });

        try {
          if (validPacket(pkt, id, cmd)) {
            this.port.off("data", onData);
            clearTimeout(timer);
            logger.debug("Valid response received", {
              id,
              cmd,
              packetLength: pkt.length,
            });
            resolve(pkt);
          }
        } catch (err) {
          this.port.off("data", onData);
          clearTimeout(timer);
          logger.error("Invalid packet received", err as Error, {
            id,
            cmd,
            packetLength: pkt.length,
            packet: Array.from(pkt)
              .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
              .join(" "),
          });
          reject(err);
        }
      };

      this.port.on("data", onData);

      timer = setTimeout(() => {
        this.port.off("data", onData);
        const timeoutError = new Error("Timed out waiting for response");
        logger.warn("Response timeout", { id, cmd, timeoutMs });
        reject(timeoutError);
      }, timeoutMs);
    });
  }
}

export default SerialTransport;
