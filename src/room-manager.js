import { GameRoom } from "./room";

export class RoomManager {
    constructor() {
        this.rooms = [];
        setInterval(this.runRoomLoopFunction.bind(this), 300);
    }

    runRoomLoopFunction() {
        for (var room of this.rooms) {
            room.onLoop.bind(room)();
        }
    }

    generateRandomId() {
        return Math.round(Math.random() * 9000 + 1000).toString();
    }

    /*
    generateValidRandomId generates a random ID, but also checks that the ID is not already associated with
    an existing room.
    */
    generateValidRandomId() {
        var id = this.generateRandomId();
        while (this.rooms.filter(x => x.id == id).length > 0) {
            id = this.generateRandomId();
        }
        return id;
    }

    getRoom(roomId) {
        var r = this.rooms.filter(x => x.roomId == roomId);
        if (!r.length) {
            return null;
        }

        return r[0];
    }

    removeIfEmpty(room) {
        if (room.clients.length == 0) {
            this.removeRoom(room.roomId);
        }
    }

    removeRoom(roomId) {
        this.rooms.splice(this.rooms.findIndex(r => r.roomId == roomId), 1);
    }

    createRoom() {
        var r = new GameRoom(this.generateValidRandomId());
        this.rooms.push(r);

        return r.roomId;
    }

    joinRoom(roomId, socket) {
        var room = this.getRoom(roomId);
        if (room.clients.filter(x => x.id == socket.id).length > 0) {
            return;
        }

        room.clients.push(socket);
        socket.room = room;
        room.onJoin(socket);
    }

    leaveRoom(socket) {
        var room = socket.room;
        if (room.clients.filter(x => x.id == socket.id).length == 0) {
            return;
        }

        room.clients.splice(room.clients.findIndex(x => x.id == socket.id), 1);
        socket.roomId = null;

        room.onLeave(socket);

        this.removeIfEmpty(room);
    }
}
