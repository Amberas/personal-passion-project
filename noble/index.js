// Read the battery level of the first found peripheral exposing the Battery Level characteristic

const noble = require('noble');
const { Client } = require("node-osc");
const { KalmanFilter } = require('kalman-filter');

const client = new Client('192.168.0.174', 8000);

const map_range = (value, low1, high1, low2, high2) => {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

//primairy service UUIDs 
const serviceUUIDs = {
    Arduino: ['12345678-1234-5678-1234-56789abcdef0'],
    ESP32: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
};

//primairy characteristics UUIDs 
const characteristicUUIDs = {
    Arduino: [['12345678-1234-5678-1234-56789abcdef1'], ['12345678-1234-5678-1234-56789abcdef2']],
    ESP32: ['beb5483e-36e1-4688-b7f5-ea07361b26a8']
}

const listen = (variable, name, valueLow, valueHigh) => {
    variable.on('data', function (data, isNotification) {
        //console.log(`${name}:`, data.readUInt8(0));
        const number = data.readUInt8(0)
        client.send(`/${name}`, map_range(number, valueLow, valueHigh, 0, 1));
    });

    variable.subscribe(function (error) {
        //console.log(`${name} notification on`);
    });
}

const observationsArduino = [];
const newObservationsArduino = [];

const observationsESP32 = [];
const newObservationsESP32 = [];

const kalmanFilterFunc = (observations, newObservations) => {
    const kFilter = new KalmanFilter();
    const res = kFilter.filterAll(observations);
    /*const sum = observations.reduce((a, b) => a + b, 0);
    const avg = (sum / observations.length) || 0;*/
    for (let index = 0; index < res.length; index++) {
        newObservations.push(res[index][0])
    }
    //const sumTwo = newObservations.reduce((a, b) => a + b, 0);
    //const avgTwo = (sumTwo / newObservations.length) || 0;
    return newObservations[newObservations.length - 1]
}

const sendDistance = (rssi, name) => {
    console.log("send distance")
    if (rssi) {
        if (name == "Arduino") {
            observationsArduino.push(rssi);
            const newRSSI = kalmanFilterFunc(observationsArduino, newObservationsArduino);
            console.log("newRSSI Arduino:", newRSSI);
            if (newRSSI <= -60) {
                client.send(`/${name}`, 0);
            } else {
                client.send(`/${name}`, 1);
            }
        } else if (name == "ESP32") {
            observationsESP32.push(rssi);
            const newRSSI = kalmanFilterFunc(observationsESP32, newObservationsESP32);
            console.log("newRSSI ESP32:", newRSSI);
            if (newRSSI <= -60) {
                client.send(`/${name}`, 0);
            } else {
                client.send(`/${name}`, 1);
            }

        }
    }
}

noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
        await noble.startScanningAsync(serviceUUIDs);
    }
});

noble.on('scanStart', function () {
    console.log('scanStart');
});

noble.on('scanStop', function () {
    console.log('scanStop');
});

noble.on('discover', async (peripheral) => {
    const localName = peripheral.advertisement.localName;

    peripheral.on("connect", function () {
        console.log(localName, "connected");
    });

    peripheral.on("disconnect", function () {
        console.log(localName, "disconnected");
    });

    if (localName == "Arduino") {
        await peripheral.connectAsync();
        setInterval(async function () {
            peripheral.updateRssi(function () {
                const rssi = peripheral.rssi;
                sendDistance(rssi, "Arduino");
            }
            )
        }, 2000);
        const txPower = peripheral.advertisement.txPower;
        console.log(txPower);
        const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(serviceUUIDs.Arduino, characteristicUUIDs.Arduino.values());
        const up = await characteristics[0];
        const down = await characteristics[1];
        const right = await characteristics[2];
        const left = await characteristics[3];
        listen(up, "up", 10, 100);
        listen(down, "down", 10, 100);
        listen(right, "right", 10, 100);
        listen(left, "left", 10, 100);

    }

    if (localName == "ESP32") {
        await peripheral.connectAsync();
        setInterval(function () {
            peripheral.updateRssi(function () {
                const rssi = peripheral.rssi;
                sendDistance(rssi, "ESP32");
            }
            )
        }, 500);
        const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(serviceUUIDs.ESP32, characteristicUUIDs.ESP32);
        const soil = await characteristics[0];
        listen(soil, "soil", 10, 250);
    }

});
