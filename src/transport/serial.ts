import { SerialPort } from "@serialport/stream";
import { autoDetect } from "@serialport/bindings-cpp";
import { SerialWriteError } from "../core/errors";
import type { Command } from "../core/commands";
import { validPacket } from "../utils";

SerialPort.bindings = autoDetect();

class SerialTransport {
  private port: SerialPort;
  private baudRate: number;

  constructor(path: string, baudRate: number = 57600) {
    this.port = new SerialPort({
      path,
      baudRate,
      parity: "none",
      stopBits: 1,
      dataBits: 8,
    });
    this.baudRate = baudRate;
  }

  public setBaudRate(n: number): void {
    this.baudRate = n;
  }

  public getBaudRate(): number {
    return this.baudRate;
  }

  public write(data: Uint8Array): Promise<void> {
    if (!this.port.isOpen) {
      throw new SerialWriteError("Serial port is not open");
    }

    return new Promise((resolve, reject) => {
      this.port.write(data, (err: Error) => {
        if (err) reject(new SerialWriteError(err.message));
        else resolve();
      });
    });
  }

  public onData(callback: (data: Uint8Array) => void): void {
    this.port.on("data", (chunk: Buffer) => {
      callback(new Uint8Array(chunk));
    });
  }

  public waitForResponse(
    id: number,
    cmd: Command,
    timeoutMs = 100
  ): Promise<Uint8Array> {
    if (!this.port.isOpen) {
      throw new SerialWriteError("Serial port is not open");
    }

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout;

      const onData = (chunk: Buffer) => {
        const pkt = new Uint8Array(chunk);

        try {
          if (validPacket(pkt, id)) {
            this.port.off("data", onData);
            clearTimeout(timer);
            resolve(pkt);
          }
        } catch (err) {
          this.port.off("data", onData);
          clearTimeout(timer);
          reject(err);
        }
      };

      this.port.on("data", onData);

      timer = setTimeout(() => {
        this.port.off("data", onData);
        reject(new Error("Timed out waiting for response"));
      }, timeoutMs);
    });
  }
}

export default SerialTransport;
