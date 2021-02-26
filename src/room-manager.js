export class RoomManager {
    constructor() {
        this.rooms = [];
        setInterval(this.checkOnRooms.bind(this), 300);
    }

    checkOnRooms() {
        for (var r of this.rooms) {
            r.onLoop.bind(r)();
        }
    }

    generateId() {
        return Math.round(Math.random() * 9000 + 1000).toString();
    }

    generateValidatedId() {
        var id = this.generateId();
        while (this.rooms.filter(x => x.id == id).length > 0) {
            id = this.generateId();
        }
        return id;
    }

    dump() {
        // console.log(this.rooms);
    }

    getRoom(roomId) {
        var r = this.rooms.filter(x => x.roomId == roomId);
        if (!r.length) {
            return null;
        }

        return r[0];
    }

    removeRoom(roomId) {
        this.rooms.splice(this.rooms.findIndex(r => r.roomId == roomId), 1);
    }

    createRoom() {
        var r = new GameRoom(this.generateValidatedId());
        this.rooms.push(r);

        this.dump();
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
        this.dump();
    }

    leaveRoom(socket) {
        var room = socket.room;
        if (room.clients.filter(x => x.id == socket.id).length == 0) {
            return;
        }

        room.clients.splice(room.clients.findIndex(x => x.id == socket.id), 1);
        socket.roomId = null;

        room.onLeave(socket);

        this.tryDispose(room);
        this.dump();
    }

    tryDispose(room) {
        if (room.clients.length == 0) {
            this.rooms.splice(this.rooms.findIndex(x => x.roomId == room.roomId), 1);            
        }
    }
}
