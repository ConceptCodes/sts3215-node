import { SerialPort } from "@serialport/stream";
import { autoDetect } from "@serialport/bindings-cpp";
import { SerialWriteError } from "../core/errors";

SerialPort.bindings = autoDetect();

export class SerialTransport {
  private port: SerialPort;
  private baudRate: number;

  constructor(path: string, baudRate: number = 57600) {
    this.port = new SerialPort({
      path,
      baudRate,
    });
    this.baudRate = baudRate;
  }

  public write(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      this.port.write(data, (err: Error) => {
        if (err) reject(new SerialWriteError(err.message));
        else resolve();
      });
    });
  }

  public setBaudRate(n: number): void {
    this.baudRate = n;
  }

  public getBaudRate(): number {
    return this.baudRate;
  }
}
