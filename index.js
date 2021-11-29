const { Board, Sensor } = require("johnny-five")
let board = new Board();

const { Client } = require("node-osc");

const client = new Client('192.168.0.174', 8000);

const map_range = (value, low1, high1, low2, high2) => {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

board.on("ready", () => {
    const sensor = new Sensor("A0");

    sensor.on("change", function () {
        client.send('/light', map_range(this.value, 0, 10, 0, 1));
    });
});


