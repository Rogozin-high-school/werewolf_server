const State = {
    LOBBY: "LOBBY",
    ROLE_SELECTION: "ROLE_SELECTION",
    PRE_GAME: "PRE_GAME",
    NIGHT_TRANSITION: "NIGHT_TRANSITION",
    NIGHT: "NIGHT",
    DAY_TRANSITION: "DAY_TRANSITION",
    DAY_CALLOUTS: "DAY_CALLOUTS",
    DISCUSSION: "DISCUSSION",
    TRIAL: "TRIAL",
    EXECUTION: "EXECUTION",
    GAME_OVER: "GAME_OVER"
};

const Role = {
    VILLAGER: "VILLAGER",
    WEREWOLF: "WEREWOLF",
    HEALER: "HEALER",
    SEER: "SEER" 
};

const Alignment = {
    GOOD: "GOOD",
    EVIL: "EVIL",
    CHAOS: "CHAOS",
    NEUTRAL: "NEUTRAL"
};

const Power = {
    NONE: 0,
    BASIC: 1,
    POWERFUL: 2,
    UNSTOPPABLE: 3
}

const dict = function(){
    var di = {};
    for (var i = 0; i < arguments.length; i++) {
        di[arguments[i][0]] = arguments[i][1];
    }
    return di;
};

const NightPlayOrder = [
    Role.WEREWOLF,
    Role.HEALER,
    Role.SEER
];

const NightCalculationOrder = [
    Role.WEREWOLF,
    Role.HEALER,
    Role.SEER
];

const NightDetails = dict(
    [Role.WEREWOLF, {
        summon_message: "Werewolves, open your eyes. Pick a player to kill.",
        end_message: "Good night, werewolves.",
        timer: 30000
    }],
    [Role.HEALER, {
        summon_message: "Healer, wake up. Pick a player to heal.",
        end_message: "Good night, healer.",
        timer: 10000
    }],
    [Role.SEER, {
        summon_message: "Fortune teller, you are summoned. Pick a player to check",
        end_message: "Good night, fortune teller.",
        timer: 10000
    }]
);

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function randomOf(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function max(arr, evaluator) {
    return arr.reduce((prev, current) => evaluator(prev) > evaluator(current) ? prev : current);
}

export class GameRoom {
    constructor() {
        this.clients = [];
        this.players = [];
        this.NightPlayOrder = [];
        
        this.roles = [Role.WEREWOLF, Role.HEALER, [Role.VILLAGER, Role.HEALER]];
        
        this.roomId = Math.round(Math.random() * 900000 + 100000).toString();
    }

    onInit() {
        console.log("Room was initialized", this.roomId);
        this.reset();
    }

    onJoin(client) {
        console.log(client.id, "joined", this.roomId);
        this.syncClientList();
        this.syncGamestate();
    }

    onLeave(client) {
        console.log(client.id, "left", this.roomId);
        this.syncClientList();
        this.syncGamestate();
    }

    onDispose(client) {
        console.log("Disposed room", this.roomId);
    }

    setTimer(millis) {
        if (!millis)
            this.timer = null;
        else
            this.timer = new Date().getTime() + millis;
    }

    setState(newState, timer, timer_hidden, noUpdate) {
        this.state = newState;
        this.setTimer(timer);
        this.timer_shown = !timer_hidden;
        
        if (!noUpdate) {
            this.syncGamestate();
        }
    }

    timerDue() {
        return this.timer && new Date().getTime() > this.timer;
    }

    /*
    Called every 500ms and should update the game states
    */
    onLoop() {
        switch (this.state) {
            case State.LOBBY:
                this.onLoop_LOBBY();
                break;
            case State.ROLE_SELECTION:
                this.onLoop_ROLESELECTION();
                break;
            case State.PRE_GAME:
                this.onLoop_PREGAME();
                break;
            case State.NIGHT_TRANSITION:
                this.onLoop_NIGHTTRANSITION();
                break;
            case State.NIGHT:
                this.onLoop_NIGHT();
                break;
            case State.DAY_TRANSITION:
                this.onLoop_DAYTRANSITION();
                break;
            case State.DAY_CALLOUTS:
                this.onLoop_DAYCALLOUTS();
                break;
        }
    }

    // Lobby state loop
    onLoop_LOBBY() {
        if (this.hostReady && this.roles.length >= this.clients.length) {
            // In order to start we verify that the roles are sufficient for the players
            this.startRoleSelection();
        }
    }

    onLoop_ROLESELECTION() {
        if (this.timerDue()) {
            this.enterPregame();
        }
    }

    onLoop_PREGAME() {
        if (this.timerDue()) {
            this.startNightTransition();
        }
    }

    onLoop_NIGHTTRANSITION() {
        if (this.timerDue()) {
            this.resetNight();
        }
    }

    onLoop_NIGHT() {
        var active = this.players.filter(x => x.active); // Getting cached active values
        console.log("Active players", active.map(x => x.id));
        
        if ((active.length == 0 || this.timerDue()) && this.minTime <= new Date().getTime()
            && !this.nightActionDone && this.nightActionStarted) {
            this.nightActionDone = true;
            

            this.setTimer(null);
            this.speak(NightDetails[this.NightPlayOrder[this.nightIndex]].end_message);
            
            setTimeout(() => {
                console.log("No active players left, incrementing nightIndex");
                this.endNightAction();
                console.log("Current nightIndex:", this.nightIndex);
                
                if (this.nightIndex < this.NightPlayOrder.length) {
                    console.log("Continuing to play. Current night order", this.NightPlayOrder[this.nightIndex]);
                    this.startNightAction();
                }
                else {
                    this.endNight();
                }
            }, 2000);            
        }
    }

    onLoop_DAYTRANSITION() {
        if (this.timerDue()) {
            this.setState(State.DAY_CALLOUTS, 1);
        }
    }

    onLoop_DAYCALLOUTS() {
        if (this.timerDue()) {
            this.nextDayCallout();
        }
    }

    endNight() {
        this.calculateWerewolfKill();
        this.calculateNightActions();
        this.callouts = this.calculateNightDeaths() || ["No one was killed tonight"];
        console.log(this.players);

        this.setState(State.DAY_TRANSITION, 5000, true);
        this.speak("Koo Koo Ree Koo, I am a chicken. Good morning village");
    }

    nextDayCallout() {
        var callout = this.callouts.shift();
        if (!callout) {
            this.setState(State.DISCUSSION, 60 * 1000 * 3.5);
        }
        else if (callout.constructor.name == "String") {
            this.speak(callout);
            this.message = callout;
            this.syncGamestate();
            this.setTimer(5000);
        }
        else if (callout.constructor.name == "Array") {
            if (callout[0] == "deadsync") {
                callout[1].dead_sync = callout[1].dead;
            }
            setTimeout(this.nextDayCallout.bind(this), 1);
        }
    }

    startRoleSelection() {
        this.calculateNightOrder();
        this.speak("Roles are now assigned");

        // Shuffling the roles deck (cards deck)
        var deck = this.roles.slice(0, this.clients.length);
        for (var i = 0; i < 100; i++) {
            shuffle(deck);
            console.log(deck);
        }

        // Initializing our playerl list (Note, NOT the client list. It's different)
        this.players.length = 0;
        for (var i in this.clients) {
            var { id, image, nickname } = this.clients[i];
            var role = deck[i];

            this.players.push(createPlayer(id, nickname, image, role));
        }
        console.log(this.players);

        // Setting the new state
        this.setState(State.ROLE_SELECTION, 10000);
    }

    calculateNightOrder() {
        var r = [];
        for (var role of this.roles) {
            if (role.constructor.name == "String") {
                if (!~r.indexOf(role)) {
                    r.push(role);
                }
            }
            else {
                for (var rrole of role) {
                    if (!~r.indexOf(rrole)) {
                        r.push(rrole);
                    }
                }
            }
        }

        this.NightPlayOrder.length = 0;
        for (var play of NightPlayOrder) {
            if (~r.indexOf(play)) {
                this.NightPlayOrder.push(play);
            }
        }
    }

    startNightTransition() {
        this.setState(State.NIGHT_TRANSITION, 4000);
        this.speak("Woof woof, I am a scary werewolf. The night begins now");
    }

    enterPregame() {
        this.setState(State.PRE_GAME, 5000, true);
        this.speak("Get ready to play...");
    }

    getActivePlayers() {
        var ps = [];
        for (var p of this.players) {
            if (p.isActive(this)) {
                p.active = true;
                ps.push(p);
            }
            else {
                p.active = false;
            }
        }
        console.log("Got active players");
        return ps;
    }

    calculateWerewolfKill() {
        var wwVotes = this.players.filter(x => x.role == Role.WEREWOLF && x.target).map(x => x.target);
        var votes = [...new Set(wwVotes)].map(y => [y, wwVotes.filter(n => n == y).length]); // Counting the votes
        var targets = [];
        for (var vote of votes) {
            if (targets.length == 0 || targets[0][1] == vote[1]) {
                targets.push(vote);
            }
            else if (targets[0][1] < vote[1]) {
                targets.length = 0;
                targets.push(vote);
            }
        }
        
        if (targets.length == 0) return;

        var target = randomOf(targets)[0];
        var attacker = randomOf(this.players.filter(x => x.role == Role.WEREWOLF && x.target == target));
        attacker.werewolfKill(target);
    }

    calculateNightActions() {
        console.log("Calculating night actions");
        for (var role of NightCalculationOrder) {
            console.log("Order:", role);
            for (var player of this.players.filter(x => x.role == role)) {
                if (player.canPerformRole(this)) {
                    player.performRole(this);
                }
            }
        }
    }

    calculateNightDeaths() {
        var day_callouts = [];
        for (var player of this.players.filter(x => !x.dead)) {
            var data = player.calculateKill();
            if (data) {
                day_callouts.push(...data);
            }
        }
        return day_callouts;
    }

    syncClientList() {
        var clients = this.clients.map(x => {
            return {
                name: x.nickname,
                id: x.id,
                image: x.image
            }
        });

        for (var client of this.clients) {
            console.log("sending client list");
            client.emit("state", { clients });
        }
    }

    syncGamestate() {
        console.log("Synchronizing game state");
        var gameState = {
            phase: this.state,
            players: this.players.map(x => x.objectify()),
            timer: this.timer_shown ? this.timer : null,
            message: this.message || null
        };
        console.log("Made gameState object");

        for (var client of this.clients) {
            console.log("Sending gameState to", client.id);
            client.emit("state", gameState);
        }
        console.log("Finished synchronizing gameState");
    }

    speak(message) {
        this.clients[0].emit("speak", message);
    }

    // Initializes the room as if the lobby phase started right now
    reset() {
        this.hostReady = false;

        this.state = State.LOBBY;
        this.timer = null;
        this.timer_shown = false;

        this.night = 0;

        this.minTime = 0;
    }

    // Sets the game up for a new 
    resetNight() {
        this.nightIndex = 0;
        this.nightActionStarted = false;
        this.setState(State.NIGHT, null, null, true);

        for (var p of this.players) {
            p.resetNight();
        }

        this.startNightAction();
    }

    startNightAction() {
        var active = this.getActivePlayers();
        this.nightActionDone = false;
        this.nightActionStarted = true;

        this.minTime = new Date().getTime() + Math.random() * 9000;
        this.setTimer(NightDetails[this.NightPlayOrder[this.nightIndex]].timer);

        this.syncGamestate();
        this.speak(
            NightDetails[this.NightPlayOrder[this.nightIndex]].summon_message);
    }

    endNightAction() {
        this.nightActionStarted = false;
        console.log(this);
        console.log(this.nightIndex);
        this.nightIndex++;
        console.log(this.nightIndex);
    }

    __msg__start_game(client, data) {
        console.log("Received START_GAME");
        if (this.state != State.LOBBY) return; // Can only start game while in lobby
        if (client.id != this.clients[0].id) return; // Only the host can start the game

        this.hostReady = true;
    }

    __msg__kick(client, data) {
        if (this.state != State.LOBBY) return; // Can only kick while in lobby
        if (client.id != this.clients[0].id) return; // Only the host can kick players

        var kicked = this.getClient(data);
        if (kicked) {
            kicked.emit("kick");
        }
    }

    __msg__night_action(client, data) {
        console.log("Night action:", data);
        var p = this.getPlayer(client.id);
        if (p) {
            p.setTarget(data, this);
        }

        console.log("Getting active players");
        this.getActivePlayers();
        console.log("Active players returned");
        this.syncGamestate();
        console.log("Executed night action");
    }

    getPlayer(id) {
        var p = this.players.filter(x => x.id == id);
        if (p.length == 0) return null;
        return p[0];
    }

    getClient(id) {
        var c = this.clients.filter(x => x.id == id);
        if (c.length == 0) return null;
        return c[0];
    }
}

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

class Player {
    constructor(id, name, image) {
        this.id = id;
        this.name = name;
        this.image = image;

        this.dead = false;
        this.dead_sync = false;

        this.active = false;

        this.attackers = [];
        this.healers = [];
    }

    init() { }
    performRole() { }

    resetNight() {
        this.target = null;
        this.attackers.length = 0;
        this.healers.length = 0;
    }

    isActive(game) {
        console.log("Checking if", this.name, "is active");
        console.log("Current order", game.NightPlayOrder[game.nightIndex], "my order", this.role);
        console.log("am i dead", this.dead);
        console.log("Did i already play", this.target);
        return game.NightPlayOrder[game.nightIndex] == this.role && !this.dead && this.target === null;
    }

    setTarget(input, game) {
        if (input === false) {
            this.target = false;
            return;
        }
        var p = game.getPlayer(input);
        if (p != null && !p.dead) {
            this.target = p;
        }
    }

    canPerformRole(game) {
        return !this.dead && this.target;
    }

    calculateKill() {
        var attack = this.attackers.length ? max(this.attackers, x => x[1]) : null;
        var defense = this.healers.length ? max(this.healers, x => x[1]) : null;

        if (attack) {
            if (!defense || attack[1] > defense[1]) {
                // Killed
                this.kill();

                var callouts = ["Tonight, we found " + this.name + ", dead in their home."];
                for (var a in this.attackers) {
                    callouts.push((a == 0 ? "They were apparently " : "They were also ") + 
                                    (this.attackers[a][2] || "attacked."));
                }
                callouts.push(["deadsync", this]);
                callouts.push("Rest in peace, " + this.name);
                return callouts;
            }
            else {
                // Saved
            }
        }
    }

    kill() {
        this.dead = true;
    }

    objectify() {
        return {
            name: this.name,
            id: this.id,
            image: this.image,
            dead: this.dead_sync,
            active: this.active,
            role: this.role
        }
    }
}

class Villager extends Player {

    init() {
        this.role = Role.VILLAGER;
        this.alignment = Alignment.GOOD;
        this.seer_result = Alignment.GOOD;
    }

    isActive() {
        return false;
    }
}

class Werewolf extends Player {
    init() {
        this.role = Role.WEREWOLF;
        this.alignment = Alignment.EVIL;
        this.seer_result = Alignment.EVIL;
    }

    isActive(game) {

        if (game.NightPlayOrder[game.nightIndex] != this.role) return false;
        if (this.dead) return false;

        var wolves = game.players.filter(x => x.role == this.role && x.target != this.target);
        if (wolves.length == 0 && this.target != null) return false;

        return true;
    }

    werewolfKill(target) {
        if (this.canPerformRole()) {
            console.log(this.name, "attacking", target.name);
            target.attackers.push([this, Power.BASIC, "attacked by a werewolf"]);
        }
    }
}

class Healer extends Player {
    init() {
        this.role = Role.HEALER;
        this.alignment = Alignment.GOOD;
        this.seer_result = Alignment.GOOD;
    }

    performRole() {
        console.log(this.name, "healing", this.target.name);
        this.target.healers.push([this, Power.BASIC]);
    }
}

class Seer extends Player {
    init() {
        this.role = Role.SEER;
        this.alignment = Alignment.GOOD;
        this.seer_result = Alignment.GOOD;
    }

    setTarget(input, game) {
        if (input === true) {
            this.target = true;
        }
        else {
            game.getClient(this.id).emit("seer_result", game.getPlayer(input));
        }
    }
}

const RoleGenerators = dict(
    [Role.VILLAGER, Villager],
    [Role.WEREWOLF, Werewolf],
    [Role.HEALER, Healer],
    [Role.SEER, Seer]
)

const createPlayer = (id, name, image, role) => {
    var player = new (RoleGenerators[role])(id, name, image);
    player.init();
    return player;
};

export { createPlayer, Role };