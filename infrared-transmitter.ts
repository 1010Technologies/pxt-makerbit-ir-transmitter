// MakeCode blocks for sending commands using an IR LED

/**
 * MakerBit
 */
//% color=#0fbc11 icon="\u272a" block="MakerBit"
//% category="MakerBit"
namespace makerbit {
  let irLed: InfraredLed;

  class InfraredLed {
    private pin: AnalogPin;
    private waitCorrection: number;

    constructor(pin: AnalogPin) {
      this.pin = pin;
      pins.analogWritePin(this.pin, 0);
      pins.analogSetPeriod(this.pin, 26);

      // Measure the time we need for a minimal bit (analogWritePin and waitMicros)
      {
        const start = input.runningTimeMicros();
        const runs = 32;
        for (let i = 0; i < runs; i++) {
          this.transmitBit(1, 1);
        }
        const end = input.runningTimeMicros();
        this.waitCorrection = Math.idiv(end - start - runs * 2, runs * 2);
      }

      // Insert a pause between callibration and first message
      control.waitMicros(2000);
    }

    public transmitBit(highMicros: number, lowMicros: number): void {
      pins.analogWritePin(this.pin, 511);
      control.waitMicros(highMicros);
      pins.analogWritePin(this.pin, 1);
      control.waitMicros(lowMicros);
    }

    public sendNec(hex32bit: string): void {
      if (hex32bit.length != 10) {
        return;
      }

      const NEC_HDR_MARK = 9000 - this.waitCorrection;
      const NEC_HDR_SPACE = 4500 - this.waitCorrection;
      const NEC_BIT_MARK = 560 - this.waitCorrection + 50;
      const NEC_HIGH_SPACE = 1690 - this.waitCorrection - 50;
      const NEC_LOW_SPACE = 560 - this.waitCorrection - 50;

      // Decompose 32bit HEX string into two manageable 16 bit numbers
      const addressSection = parseInt(hex32bit.substr(0, 6));
      const commandSection = parseInt("0x" + hex32bit.substr(6, 4));
      const sections = [addressSection, commandSection];

      // send the header
      this.transmitBit(NEC_HDR_MARK, NEC_HDR_SPACE);

      // send the address and command bits
      sections.forEach((section) => {
        let mask = 1 << 15;
        while (mask > 0) {
          if (section & mask) {
            this.transmitBit(NEC_BIT_MARK, NEC_HIGH_SPACE);
          } else {
            this.transmitBit(NEC_BIT_MARK, NEC_LOW_SPACE);
          }
          mask >>= 1;
        }
      });

      // mark the end of transmission
      this.transmitBit(NEC_BIT_MARK, 0);
    }
  }

  /**
   * Connects to the IR-emitting LED at the specified pin.
   * @param pin IR LED pin, eg: AnalogPin.P0
   */
  //% subcategory="IR Sender"
  //% blockId="makerbit_infrared_sender_connect"
  //% block="connect IR sender LED at pin %pin"
  //% pin.fieldEditor="gridpicker"
  //% pin.fieldOptions.columns=4
  //% pin.fieldOptions.tooltips="false"
  //% weight=90
  export function connectIrSenderLed(pin: AnalogPin): void {
    irLed = new InfraredLed(pin);
  }

  /**
   * Sends a 32bit IR datagram using the NEC protocol.
   * @param hex32bit a 32bit hex string, eg: 0x00FF02FD
   */
  //% subcategory="IR Sender"
  //% blockId="makerbit_infrared_sender_send_datagram"
  //% block="send IR datagram %hex32bit"
  //% weight=80
  export function sendIrDatagram(hex32bit: string): void {
    if (!irLed) {
      return;
    }
    irLed.sendNec(hex32bit);
  }

  /**
   * Returns an NEC IR datagram as a 32bit hex string.
   * @param address an 8bit address, eg. 0
   * @param command an 8bit command, eg. 2
   */
  //% subcategory="IR Sender"
  //% blockId=makerbit_infrared_sender_nec_datagram
  //% block="address %address | command %command"
  //% address.min=0 address.max=255
  //% command.min=0 command.max=255
  //% weight=56
  export function irNec(address: number, command: number): string {
    const addrSection = ((address & 0xff) << 8) | (~address & 0xff);
    const cmdSection = ((command & 0xff) << 8) | (~command & 0xff);
    return "0x" + to16BitHex(addrSection) + to16BitHex(cmdSection);
  }

  function to16BitHex(value: number): string {
    let hex = "";
    for (let pos = 0; pos < 4; pos++) {
      let remainder = value % 16;
      if (remainder < 10) {
        hex = remainder.toString() + hex;
      } else {
        hex = String.fromCharCode(55 + remainder) + hex;
      }
      value = Math.idiv(value, 16);
    }
    return hex;
  }
}
