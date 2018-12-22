const express = require("express");
const app = express();

const Server = require("http").Server;
const server = new Server(app);

const socketio = require("socket.io");
var io = socketio(server);

const { RoomManager, GameRoom } = require("./src/Room");

const manager = new RoomManager();

io.on("connection", function(socket) {
    console.log("Client has connected");
    socket.emit("connected");

    socket.on("disconnecting", function(reason) {
        console.log("client disconnected", reason);
        if (socket.room) {
            manager.leaveRoom(socket);
        }
    });

    socket.on("nickname", function(data) {
        console.log("Received nickname ", socket.id, data);
        socket.nickname = data;

        var imgs = [
            "https://semantic-ui.com/images/avatar/small/steve.jpg",
            "https://semantic-ui.com/images/avatar2/small/matthew.png",
            "https://semantic-ui.com/images/avatar2/large/rachel.png",
            "https://semantic-ui.com/images/avatar2/small/elyse.png",
            "https://semantic-ui.com/images/avatar/large/elliot.jpg",
            "https://semantic-ui.com/images/avatar/large/daniel.jpg",
            "https://semantic-ui.com/images/avatar2/large/molly.png",
            "https://semantic-ui.com/images/avatar/large/jenny.jpg",
            "https://semantic-ui.com/images/avatar/large/helen.jpg",
            "https://semantic-ui.com/images/avatar/large/veronika.jpg"
        ];
        socket.image = imgs[Math.floor(Math.random()*imgs.length)];
    });

    socket.on("join", function(data) {
        var room = manager.getRoom(data);
        if (!room) {
            socket.emit("join_error", "Could not find party ID");
            return;
        }

        manager.joinRoom(room.roomId, socket);
        socket.emit("room", room.roomId);
    });

    socket.on("create", function(data) {
        var room = manager.createRoom();
        manager.joinRoom(room, socket);
        socket.emit("room", room);
    });

    socket.on("action", function(data) {
        var room = socket.room;
        if (!room) return;

        room.flow.phase.handle(socket, room, data.type, data.payload);
    });
});

io.listen(12988);
console.log("Listening on 12988"); 