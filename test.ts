/**
 * IR transmitter tests
 */
makerbit.connectIrSenderLed(AnalogPin.P0);
makerbit.sendIrDatagram("0x67349823");

// Simulate an OK command by the Keyes remote control
makerbit.irNec(0, 2);
makerbit.sendIrDatagram(makerbit.irNec(0, 2));
