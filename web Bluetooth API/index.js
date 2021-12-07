/*const { Board, Sensor } = require("johnny-five")
let board = new Board();

const { Client } = require("node-osc");

const client = new Client('192.168.0.174', 8000);



board.on("ready", () => {
    const sensor = new Sensor("A0");

    sensor.on("change", function () {
        client.send('/light', map_range(this.value, 0, 10, 0, 1));
    });
});*/

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const { Client } = require("node-osc");

const client = new Client('192.168.0.174', 8000);

const port = 3000;

app.use(express.static('public'));

http.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});

const map_range = (value, low1, high1, low2, high2) => {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

io.on('connection', socket => {
    console.log('Socket connected', socket.id);

    socket.on('up', number => {
        console.log("up:", number);
        client.send('/up', map_range(number, 0, 100, 0, 1));
    });

    socket.on('down', number => {
        console.log("down:", number);
        client.send('/down', map_range(number, 0, 100, 0, 1));
    });

    socket.on('left', number => {
        console.log("left:", number);
        client.send('/left', map_range(number, 0, 100, 0, 1));
    });

    socket.on('right', number => {
        console.log("right:", number);
        client.send('/right', map_range(number, 0, 100, 0, 1));
    });

    socket.on('soil', number => {
        console.log("soil:", number);
        client.send('/soil', map_range(number, 900, 3000, 0, 1));
    });

});