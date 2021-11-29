const { Board, Sensor } = require("johnny-five")
let board = new Board();

const { Client } = require("node-osc");

const client = new Client('192.168.0.174', 8000);

board.on("ready", () => {
    const sensor = new Sensor("A0");

    sensor.on("change", function () {
        console.log(this.value);

        client.send('/light', this.value);
    });
});


