

class PhaseManager {
    constructor(room, initialPhase) {
        this.room = room;
        this.setPhase = this.setPhase.bind(this);
        this.setPhase(initialPhase);
        
    }

   setPhase(p) {
        if (this.phase) {
            this.phase.finalize();
        }

        this.phase = new p(this.setPhase);
        this.phase.fire();

        this.room.syncGamestate();
    }

    next() {
        var p = this.phase.next();
        if (p) {
            this.setPhase(p);
        }
    }

    current() {
        return this.phase.constructor.name;
    }
}

class Phase {
    constructor(dispatch) {
        this.dispatch = dispatch;
    }

    /*
    Occurs when this state starts. Should initialize everything and do stuff
    */
    fire(room) {

    }

    /*
    When this phase is about to be changed
    */
    finalize(room) {

    }

    /*
    Tells us what the next phase is. If no phase change is required, returns null.
    */
    next() {
        return null;
    }

    /*
    Handles messages from clients
    */
    handle(client, room, message, data) {

    }
}

class LobbyPhase extends Phase {
    handle(client, room, message, data) {
        if (message = "start" && client.id == room.clients[0].id) {
            console.log("Starting game");
            this.dispatch(RoleDistPhase)
        }
    }
}

class RoleDistPhase extends Phase {
    
    shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }

    fire(room) {
        var roles_list = ["villager", "werewolf", "healer", "seer", "villager"];
        roles_list = roles_list.slice(0, room.clients.length);
        this.shuffle(roles_list);

        room.players = [];
        for (var cid in room.clients) {
            room.players.push("new player");
        }
    }
    
    handle(client, room, message, data) {

    }
}

export {
    PhaseManager,
    Phase,
    LobbyPhase,
    RoleDistPhase
}