import socketio from "socket.io";
import express from "express";
import { Server } from "http";

import { RoomManager } from "./src/room-manager";
import { randomAvatar, randomName } from "./src/avatars";

const app = express();
const server = new Server(app);
const io = socketio(server);
const manager = new RoomManager();

// TODO: How do we handle versioning?
const VERSION = "1.0.3";

const ServerMessage = {
  CONNECTED: "connected",
  REFRESH_FAIL: "refresh_fail",
  ROOM: "room",
  VERSION: "version",
  JOIN_ERROR: "join_error",
  JOINED_ROOM: "room",
  RANDOM_AVATARS: "bitmoji",
};

const ClientMessage = {
  DISCONNECTING: "disconnecting",
  REFRESH_TOKEN: "refresh_token",
  VERSION: "version",
  DETAILS: "details",
  JOIN_ROOM: "join",
  CREATE_ROOM: "create",
  LEAVE_ROOM: "leave",
  TAKE_ACTION_IN_ROOM: "action",
  GET_RANDOM_AVATARS: "bitmoji",
};

io.on("connection", (socket) => {
  console.log("[General] Client has connected: ");
  socket.emit(ServerMessage.CONNECTED);

  socket.on(ClientMessage.DISCONNECTING, (reason) => {
    console.log("[General] client disconnected", reason);
    if (socket.room) {
      manager.leaveRoom(socket);
    }
  });

  socket.on(ClientMessage.REFRESH_TOKEN, (token) => {
    const roomId = token.split("/")[0];
    const socketId = token.split("/")[1];

    const room = manager.getRoom(roomId);
    if (!room) {
      socket.emit(ServerMessage.REFRESH_FAIL);
      return;
    }

    const player = room.getPlayer(socketId);
    if (!player) {
      socket.emit(ServerMessage.REFRESH_FAIL);
      return;
    }

    player.id = socket.id;
    manager.joinRoom(roomId, socket);
    socket.emit(ServerMessage.ROOM, roomId);
  });

  socket.on(ClientMessage.VERSION, () => {
    socket.emit(ServerMessage.VERSION, VERSION);
  });

  socket.on(ClientMessage.DETAILS, (data) => {
    socket.nickname = data.nickname || randomName();
    socket.color = data.color || "skyblue";
    socket.image = data.avatar || randomAvatar();
  });

  socket.on(ClientMessage.JOIN_ROOM, (data) => {
    const room = manager.getRoom(data);
    if (!room) {
      socket.emit(ServerMessage.JOIN_ERROR, "Could not find party ID");
      return;
    }

    if (room.state != "LOBBY") {
      socket.emit(ServerMessage.JOIN_ERROR, "Room is in the middle of a game");
      return;
    }

    manager.joinRoom(room.roomId, socket);
    socket.emit(ServerMessage.JOINED_ROOM, room.roomId);
  });

  socket.on(ClientMessage.CREATE_ROOM, () => {
    const room = manager.createRoom();
    manager.joinRoom(room, socket);
    socket.emit(ServerMessage.JOINED_ROOM, room);
  });

  socket.on(ClientMessage.LEAVE_ROOM, () => {
    if (socket.room) {
      manager.leaveRoom(socket);
    }
  });

  socket.on(ClientMessage.TAKE_ACTION_IN_ROOM, (data) => {
    let room = socket.room;
    if (!room) return;

    if (room["__msg__" + data.type]) {
      room["__msg__" + data.type](socket, data.payload);
    }
  });

  socket.on(ClientMessage.GET_RANDOM_AVATARS, () => {
    let data = [];
    for (var i = 0; i < 50; i++) {
      data.push(randomAvatar());
    }

    socket.emit(ServerMessage.RANDOM_AVATARS, data);
  });
});

// This should suppress all exceptions?
process.on("uncaughtException", function (err) {
  console.log("=====> Server error: ", err);
});

// TODO: port configuration. How do we do that properly?
let port = process.env.PORT || 12988;
io.listen(port);
console.log("[General] Listening on " + port);
