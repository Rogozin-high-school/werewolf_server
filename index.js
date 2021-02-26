import socketio from "socket.io";
import express from "express";
import { Server } from "http";

import { RoomManager } from "./src/Room";
import { randomAvatar } from "./src/avatars";

const app = express();
const server = new Server(app);
const io = socketio(server);
const manager = new RoomManager();

const VERSION = "1.0.3";

io.on("connection", function(socket) {
    console.log("Client has connected: ");
    socket.emit("connected");

    socket.on("disconnecting", function(reason) {
        console.log("client disconnected", reason);
        if (socket.room) {
            manager.leaveRoom(socket);
        }
    });

    socket.on("refresh_token", function(token) {
        var roomId = token.split("/")[0];
        var socketId = token.split("/")[1];

        var room = manager.getRoom(roomId);
        if (!room) {
            socket.emit("refresh_fail");
            console.log("Refresh token restoration failed: room does not exist");
            return;
        }

        var player = room.getPlayer(socketId);
        if (!player) {
            socket.emit("refresh_fail");
            console.log("Refresh token restoration failed: player was not found");
            return;
        }

        player.id = socket.id;
        manager.joinRoom(roomId, socket);
        socket.emit("room", roomId);
    });

    socket.on("version", function() {
        socket.emit("version", VERSION);
    });

    socket.on("details", function(data) {
        console.log("Received nickname ", socket.id, data);
        socket.nickname = data.nickname || "foo";
        socket.color = data.color || "skyblue";
        socket.image = data.avatar || randomAvatar();
    });

    socket.on("debug", function(data) {
        console.log("Socket debug >>>", data);
    })

    socket.on("join", function(data) {
        var room = manager.getRoom(data);
        if (!room) {
            socket.emit("join_error", "Could not find party ID");
            return;
        }
        if (room.state != "LOBBY") {
            socket.emit("join_error", "Room is in the middle of a game");
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

    socket.on("leave", function(data) {
        if (socket.room) {
            manager.leaveRoom(socket);
        }
    });

    socket.on("action", function(data) {
        var room = socket.room;
        if (!room) return;

        if (room["__msg__" + data.type]) {
            room["__msg__" + data.type](socket, data.payload);
        }
    });

    socket.on("bitmoji", function() {
        var data = [];
        for (var i = 0; i < 30; i++) data.push(randomAvatar());
        socket.emit("bitmoji", data);
    });
});

process.on('uncaughtException', function (err) {
    console.log('=====> Server error: ', err);
});

let port = process.argv[2] || 12988;
io.listen(port);
console.log("Listening on " + port);
