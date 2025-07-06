import { Servo } from "./servo/index";
import SerialTransport from "./transport/serial";

const serialPort = "/dev/tty.usbmodem58FD0169121";
const baudRate = 1000000;

const transport = new SerialTransport(serialPort, baudRate);

await new Promise((resolve, reject) => {
  transport["port"].on("open", resolve);
  transport["port"].on("error", reject);

  setTimeout(() => reject(new Error("Serial port open timeout")), 2000);
});

const servo = new Servo(1, transport);

const position = await servo.readPosition();
console.log("position: ", position);
