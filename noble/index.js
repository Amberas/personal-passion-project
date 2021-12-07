// Read the battery level of the first found peripheral exposing the Battery Level characteristic

const noble = require('noble');

noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
        await noble.startScanningAsync(['4fafc201-1fb5-459e-8fcc-c5c9c331914b'], false);
    }
});

noble.on('discover', async (peripheral) => {
    await noble.stopScanningAsync();
    await peripheral.connectAsync();
    console.log(`connected to ${peripheral.advertisement.localName}`);
    const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(['4fafc201-1fb5-459e-8fcc-c5c9c331914b'], ['beb5483e-36e1-4688-b7f5-ea07361b26a8']);
    const soil = await characteristics[0];

    soil.on('data', function (data, isNotification) {
        console.log('soil:', data.readUInt8(0));
    });

    soil.subscribe(function (error) {
        console.log('soil notification on');
    });
    // await peripheral.disconnectAsync();
    //process.exit(0);
});