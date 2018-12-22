import { PhaseManager, LobbyPhase } from "./Phase";

const State = {
    LOBBY: 0,
    ROLE_SELECTION: 1
};

export class GameRoom {
    constructor() {
        this.clients = [];
        this.players = [];
        
        this.roomId = Math.round(Math.random() * 900000 + 100000).toString();

        this.state = State.LOBBY;
    }

    onInit() {
        console.log("Room was initialized", this.roomId);
    }

    onJoin(client) {
        console.log(client.id, "joined", this.roomId);
        this.syncClientList();
    }

    onLeave(client) {
        console.log(client.id, "left", this.roomId);
        this.syncClientList();
    }

    onDispose(client) {
        console.log("Disposed room", this.roomId);
    }

    syncClientList() {
        var clients = this.clients.map(x => {
            return {
                name: x.nickname,
                id: x.id,
                img: x.image
            }
        });

        for (var client of this.clients) {
            console.log("sending client list");
            client.emit("state", { clients });
        }
    }

    syncGamestate() {
        if (!this.state) return; // No synchronizing without the state manager

        var gameState = {
            state: this.state
        };

        for (var client of this.clients) {
            client.emit("state", gameState);
        }
    }

    __msg
}

export class RoomManager {
    constructor() {
        this.rooms = [];
    }

    dump() {
        console.log(this.rooms);
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
        var r = new GameRoom();
        this.rooms.push(r);

        r.onInit();
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
            room.onDispose();
            this.rooms.splice(this.rooms.findIndex(x => x.roomId == room.roomId), 1);            
        }
    }
}