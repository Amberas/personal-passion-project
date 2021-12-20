const noble = require('noble');
const { Client } = require("node-osc");
const { KalmanFilter } = require('kalman-filter');

const client = new Client('192.168.0.174', 8000);

const observationsArduino = [];
const newObservationsArduino = [];

const observationsESP32 = [];
const newObservationsESP32 = [];

//primairy service UUIDs 
const serviceUUIDs = {
    Arduino: ['12345678-1234-5678-1234-56789abcdef0'],
    ESP32: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b'],
    ESP32TWO: ["0d3e9cec-9c0d-42d9-b752-93ca7cdbd31a"]
};

//primairy characteristics UUIDs 
const characteristicUUIDs = {
    Arduino: [['12345678-1234-5678-1234-56789abcdef1'], ['12345678-1234-5678-1234-56789abcdef2']],
    ESP32: [['beb5483e-36e1-4688-b7f5-ea07361b26a8'], ['a1bee35a-5ab9-11ec-bf63-0242ac130002'], ["c92ecec0-5c51-11ec-bf63-0242ac130002"]],
    ESP32TWO: [["a350e8ca-5e8e-11ec-bf63-0242ac130002"], ["a6b802d2-5e8e-11ec-bf63-0242ac130002"], ["a9eb506c-5e8e-11ec-bf63-0242ac130002"]]
}


//function processing
const map_range = (value, low1, high1, low2, high2) => {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

//listen for characteristic change
const listen = (variable, name, valueLow, valueHigh) => {
    variable.on('data', function (data, isNotification) {
        console.log(`${name}:`, data.readUInt8(0));
        const number = data.readUInt8(0)
        client.send(`/${name}`, map_range(number, valueLow, valueHigh, 0, 1));

        if (name == "touch" && number <= 18) {
            console.log("touch");
            client.send(`/${name}`, 1);
        } else if (name == "touch") {
            client.send(`/${name}`, 0);
        }

        if (name == "touchTwo" && number <= 29) {
            console.log("touch");
            client.send(`/${name}`, 1);
        } else if (name == "touchTwo") {
            client.send(`/${name}`, 0);
        }
    });

    variable.subscribe(function (error) {
        //console.log(`${name} notification on`);
    });
}

//kalmanfilter -> against noise
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

//send proximity to Ableton + send to arduino (display)
const sendDistance = (rssi, name, char) => {
    console.log("send distance")
    if (rssi) {
        if (name == "Arduino") {
            observationsArduino.push(rssi);
            const newRSSI = kalmanFilterFunc(observationsArduino, newObservationsArduino);
            console.log("newRSSI Arduino:", newRSSI);
            if (newRSSI <= -70) {
                client.send(`/${name}`, 0);
            } else {
                client.send(`/${name}`, 1);
            }
        } else if (name == "ESP32") {
            observationsESP32.push(rssi);
            const newRSSI = kalmanFilterFunc(observationsESP32, newObservationsESP32);
            console.log("newRSSI ESP32:", newRSSI);
            if (newRSSI <= -70) {
                char.write(Buffer.from('0'), true, function (error) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("written 0");
                    }
                }.bind(this));

                client.send(`/${name}`, 0);
                client.send(`/touch`, 0);
            } else {
                char.write(Buffer.from('1'), true, function (error) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("written 1");
                    }
                }.bind(this));


                client.send(`/${name}`, 1);
            }

        }
    }
}


const init = () => {


    noble.on('stateChange', (state) => {
        if (state === 'poweredOn') {
            setInterval( async function () {
                await noble.startScanningAsync(serviceUUIDs);
            }, 5000);
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
            const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(serviceUUIDs.ESP32, characteristicUUIDs.ESP32.values());
            const soil = await characteristics[0];
            const touch = await characteristics[1];
            const screen = await characteristics[2];
            setInterval(function () {
                peripheral.updateRssi(function () {
                    const rssi = peripheral.rssi;
                    sendDistance(rssi, "ESP32", screen);
                }
                )
            }, 1000);

            listen(soil, "soil", 10, 250);
            listen(touch, "touch", 5, 10);
        }

        if (localName == "ESP32TWO") {
            await peripheral.connectAsync();
            const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(serviceUUIDs.ESP32TWO, characteristicUUIDs.ESP32TWO.values());
            const soil = await characteristics[0];
            const touch = await characteristics[1];
            const screen = await characteristics[2];
            setInterval(function () {
                peripheral.updateRssi(function () {
                    const rssi = peripheral.rssi;
                    sendDistance(rssi, "ESP32TWO", screen);
                }
                )
            }, 1000);

            listen(soil, "soilTwo", 10, 250);
            listen(touch, "touchTwo", 5, 10);
        }

    });

}

init();
