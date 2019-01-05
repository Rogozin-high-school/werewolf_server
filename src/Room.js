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
    SEER: "SEER",
    WITCH: "WITCH",
    JESTER: "JESTER"
};

const Alignment = {
    GOOD: "GOOD",
    EVIL: "EVIL",
    CHAOS: "CHAOS",
    NEUTRAL: "NEUTRAL"
};

const Faction = {
    VILLAGE: "VILLAGE",
    WEREWOLVES: "WEREWOLVES",
    NEUTRAL: "NEUTRAL",
    WITCH: "WITCH"
}

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
    Role.JESTER,
    Role.WITCH,
    Role.WEREWOLF,
    Role.HEALER,
    Role.SEER
];

const NightCalculationOrder = [
    Role.WITCH,
    Role.JESTER,
    Role.WEREWOLF,
    Role.HEALER,
    Role.SEER
];

const NightDetails = dict(
    [Role.WEREWOLF, {
        summon_message: "Werewolves, wake up. Pick a player to kill.",
        end_message: "Good night, werewolves.",
        timer: 3000000
    }],
    [Role.HEALER, {
        summon_message: "Healer, wake up. Pick a player to heal.",
        end_message: "Good night, healer.",
        timer: 10000
    }],
    [Role.SEER, {
        summon_message: "Fortune teller, wake up. Pick a player to check.",
        end_message: "Good night, fortune teller.",
        timer: 10000
    }],
    [Role.WITCH, {
        summon_message: "Witch, wake up. Pick a player to cast your spells on.",
        end_message: "Good night, witch.",
        timer: 15000
    }],
    [Role.JESTER, {
        summon_message: "Jester, wake up. Pick a player to haunt.",
        end_message: "Good night, jester.",
        timer: 10000,
        should_play: function(game) {
            return game.players.filter(x => x.role == Role.JESTER && x.haunting).length;
        }
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
    constructor(id, isTest = false) {
        if (isTest) {
            this.DEBUG = true;
        }

        this.clients = [];
        this.players = [];
        this.NightPlayOrder = [];
        
        this.roles = [Role.WEREWOLF, Role.JESTER, Role.VILLAGER];
        
        this.roomId = id;
    }

    onInit() {
        console.log("Room was initialized", this.roomId);
        this.reset();
    }

    onJoin(client) {
        console.log(client.id, "joined", this.roomId);
        this.speak(client.nickname + " has joined the town");
        this.syncClientList();
        this.syncGamestate();
        this.syncRolesList();
    }

    onLeave(client) {
        console.log(client.id, "left", this.roomId);
        this.speak(client.nickname + " has left the town");
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
                // this.onLoop_LOBBY();
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
            case State.DISCUSSION:
                this.onLoop_DISCUSSION();
                break;
            case State.TRIAL:
                this.onLoop_TRIAL();
                break;
            case State.EXECUTION:
                this.onLoop_EXECUTION();
                break;
            case State.GAME_OVER:
                this.onLoop_GAMEOVER();
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
                this.tryIncrementNightAction();
            }, 2000);            
        }
    }

    tryIncrementNightAction() {
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

    onLoop_DISCUSSION() {
        if (this.timerDue()) {
            this.startNightTransition();
        }
    }

    onLoop_TRIAL() {
        if (this.timerDue()) {
            this.speak("The town could not decide whether to lych " + this.player_on_stand.name);
            this.trialInnocent();
        }
    }

    onLoop_EXECUTION() {
        if (this.timerDue()) {
            this.player_on_stand.execute()
            this.player_on_stand = null;


            if (!this.calculateVictory()) {
                this.startNightTransition();
            }
        }
    }

    onLoop_GAMEOVER() {
        if (this.timerDue()) {
            this.reset();
            this.setState(State.LOBBY);
        }
    }

    endNight() {
        this.calculateNightActions();
        this.calculateWerewolfKill();
        this.callouts = this.calculateNightDeaths() || ["No one was killed tonight"];
        
        this.setDayTransition();
    }

    setDayTransition() {

        this.player_on_stand = null;

        for (var p of this.players) {
            p.resetDay();
        }

        this.setState(State.DAY_TRANSITION, 5000, true);
        //this.speak("Koo Koo Ree Koo, I am a chicken. Good morning village");

        this.broadcaseNightMessages();
    }

    broadcaseNightMessages() {
        for (var player of this.players.filter(x => !x.dead_sync)) {
            var c = this.getClient(player.id);
            if (c) c.emit("open_messages", player.messages);
        }
    }

    nextDayCallout() {
        var callout = this.callouts.shift();
        if (!callout) {
            if (!this.calculateVictory()) {
                this.setState(State.DISCUSSION, 60 * 1000 * 3.5);
            }
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

    getRole(roleOpts) {
        if (roleOpts.constructor.name == "String") return roleOpts;
        else return randomOf(roleOpts);
    }

    startRoleSelection() {
        this.calculateNightOrder();
        this.speak("Players, prepare for your roles!");

        // Shuffling the roles deck (cards deck)
        var deck = this.roles.slice(0, this.clients.length);
        for (var i = 0; i < 100; i++) {
            shuffle(deck);
            console.log(deck);
        }

        // Initializing our playerl list (Note, NOT the client list. It's different)
        this.players.length = 0;
        for (var i in this.clients) {
            var { id, image, nickname, color } = this.clients[i];
            var role = this.getRole(deck[i]);

            this.players.push(createPlayer(id, nickname, image, color, role));
        }

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
        this.night++;
        // this.speak("Woof woof, I am a scary werewolf. The night begins now");
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

        var witched = false;

        for (var ww of this.players.filter(x => x.role == Role.WEREWOLF && x.target && x.witched)) {
            if (ww.target != target) {
                ww.werewolfKill(ww.target);
                witched = true;
            }
        }

        if (witched) return; // If a werewolf got witched, they will attack INSTEAD the witch target
                             // instead of the voting target

        var wwVotes = this.players.filter(x => x.role == Role.WEREWOLF && x.target && !x.witched).map(x => x.target);
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

        var target = null;
        
        if (targets.length != 0) {
            target = randomOf(targets)[0];
            var attacker = randomOf(this.players.filter(x => x.role == Role.WEREWOLF && x.target == target));
            attacker.werewolfKill(target);
        }        
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

        var killsTonight = this.players.filter(x => x.dead && !x.dead_sync);
        if (killsTonight) {
            this.nights_no_kill = 0;
        }
        else {
            this.nights_no_kill++;
        }

        return day_callouts;
    }

    syncClientList() {
        var clients = this.clients.map(x => {
            return {
                name: x.nickname,
                id: x.id,
                image: x.image,
                color: x.color
            }
        });

        for (var client of this.clients) {
            console.log("sending client list");
            client.emit("state", { clients });
        }
    }

    syncRolesList() {
        var gameState = {
            roles: this.roles
        };

        for (var client of this.clients) {
            client.emit("state", gameState);
        }
    }

    syncGamestate() {
        var gameState = {
            phase: this.state,
            players: this.players.map(x => x.objectify(this)),
            timer: this.timer_shown ? this.timer : null,
            message: this.message || null,
            player_on_stand: this.player_on_stand ? this.player_on_stand.objectify(this) : null,
            winning_faction: this.winning_faction && this.winning_faction.constructor.name == "String" ? this.winning_faction : "DRAW"
        };

        for (var client of this.clients) {
            client.emit("state", gameState);
        }
    }

    speak(message) {
        if (!this.DEBUG && this.clients.length > 0)
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

        this.player_on_stand = null;

        this.winning_faction = null;

        this.nights_no_kill = 0;

        this.players.length = 0;
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

        var filter = NightDetails[this.NightPlayOrder[this.nightIndex]].should_play;
        if (filter && !filter(this)) {
            this.tryIncrementNightAction(); // recursive but it's ok by me
            return;
        }

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

    __msg__add_role(client, data) {
        if (Role[data]) {
            this.roles.push(data);
            this.syncRolesList();
        }
    }

    __msg__remove_role(client, data) {
        if (data < this.roles.length) {
            this.roles.splice(data, 1);
            this.syncRolesList();
        }
    }

    __msg__set_preset(client, data) {
        this.roles = data;
        this.syncRolesList();
    }

    __msg__start_game(client, data) {
        console.log("Received START_GAME");
        console.log(client.id, client.nickname, this.clients[0].id, this.clients[0].nickname);
        if (this.state != State.LOBBY) return; // Can only start game while in lobby
        if (client.id != this.clients[0].id) return; // Only the host can start the game
        if (this.roles.length < this.clients.length) return; // Not enough role cards to start?

        this.startRoleSelection();
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

    __msg__set_vote(client, data) {

        if (this.state != State.DISCUSSION) return;

        var p = this.getPlayer(client.id);
        var t = this.getPlayer(data);

        if (p.dead || t.dead) return;
        
        if (p.id == t.id || (p.vote && p.vote.id == t.id)) {
            p.vote = null;
        }
        else {
            p.vote = t;
        }

        if (this.players.filter(x => !x.dead && x.vote == t).length > this.players.filter(x => !x.dead).length / 2) {
            this.setTrial(t);
        }

        this.syncGamestate();
    }

    __msg__trial_innocent(client) {
        if (this.state != State.TRIAL) return;  // Can only take this action in the TRIAL state
        if (client.id != this.clients[0].id) return; // Only host can execute/free accusees

        this.speak("The town has decided to set " + this.player_on_stand.name + " free.");

        this.trialInnocent();
    }

    __msg__trial_guilty(client) {
        if (this.state != State.TRIAL) return;  // Can only take this action in the TRIAL state
        if (client.id != this.clients[0].id) return; // Only host can execute/free accusees

        this.speak("The town has decided to execute " + this.player_on_stand.name + ". May god have mercy on your soul");

        this.trialGuilty();
    }

    __msg__skip_day(client) {
        if (this.state != State.DISCUSSION) return;  // Can only take this action in the DISCUSSION state
        if (client.id != this.clients[0].id) return; // Only host can skip day

        this.startNightTransition();
    }

    setTrial(player) {
        console.log(player.name, "is now on trial");
        
        this.discussion_timer = this.timer - new Date().getTime(); // Preserving the discussion timer
        
        this.player_on_stand = player;
        this.message = player.name + ", you are on trial for conspiracy against the town. What say you?"
        
        this.speak("The town has decided to put " + this.player_on_stand.name + " on trial.");
        
        this.setState(State.TRIAL, 60 * 1000);
    }

    trialInnocent() {
        for (var p of this.players) {
            p.resetDay();
        }

        this.setState(State.DISCUSSION, this.discussion_timer);
    }

    trialGuilty() {
        this.setState(State.EXECUTION, 6000);
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

    /*
    Returns the winning faction, or null if the game continues.
    Return values:
        null
        "DRAW" (by wipeout, draws between two factions are represented in an array)
        "VILLAGE"
        "WEREWOLVES"
        "NEUTRAL"
    */
    getWinningFaction() {
        var alive = this.players.filter(x => !x.dead);
        var village = alive.filter(x => x.faction == Faction.VILLAGE);
        var werewolves = alive.filter(x => x.faction == Faction.WEREWOLVES);
        var neutral = alive.filter(x => x.faction == Faction.NEUTRAL);
        var witches = alive.filter(x => x.faction == Faction.WITCH);

        var healers = alive.filter(x => x.role == Role.HEALER);

        if (alive.length == 0) {
            return "DRAW";
        }

        if (neutral.length == alive.length) {
            return Faction.NEUTRAL;
        }

        if (village.length + neutral.length == alive.length) {
            return Faction.VILLAGE;
        }
        
        // Witch vs town delayed victory
        // If witch is against the town (with no WWs), if the town does not have
        // killing roles such as priests or veterans, witch should immediately lose
        if (village.length + witches.length == alive.length) {
            return Faction.VILLAGE;
        }

        // witch vs ww delayed victory
        // In case of 1 witch + 1 ww, no-one can lynch the other.
        // In the following night, the witch witches the ww to kill themselves and wins.
        if (witches.length == 1 && werewolves.length == 1) {
            return Faction.WITCH;
        }

        // WW vs healer stalemate
        // If 1 ww + 1 healer are alive, draw should be immediately called
        if (healers.length == 1 && werewolves.length == 1) {
            return [Faction.VILLAGE, Faction.WEREWOLVES];
        }

        if (werewolves.length + neutral.length == alive.length) {
            return Faction.WEREWOLVES
        }

        if (witches.length + neutral.length == alive.length) {
            return Faction.WITCH;
        }

        // Uncalculated stalemate prevention
        // If there are three nights with no kills, game will stale and a draw will be announced
        if (this.night >= 3 && this.nights_no_kill >= 3) {
            return "DRAW";
        }

        return null;
    }

    calculateVictory() {
        var f = this.getWinningFaction();
        
        if (f) {
            for (var p of this.players) {
                p.won = p.isVictorious(f);
            }
            this.winning_faction = f;

            this.setState(State.GAME_OVER, 16000);
            return true;
        }

        return false;
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
        var r = new GameRoom(this.generateValidatedId());
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
    constructor(id, name, image, color) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.color = color;

        this.dead = false;
        this.dead_sync = false;

        this.active = false;

        this.attackers = [];
        this.healers = [];

        this.messages = [];
        this.vote = null;

        this.won = false;
    }

    init() { }
    performRole() { }

    resetNight() {
        this.target = null;

        this.attackers.length = 0;
        this.healers.length = 0;
        this.messages.length = 0;

        this.witched = false; // For witch action
    }

    resetDay() {
        this.vote = null;
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
                this.sendMessage("Someone attacked you but you were saved!")
                callouts.push(this.name + " was apparently attacked tonight, but they survived");
            }
        }
    }

    kill() {
        this.dead = true;
    }

    execute() {
        this.dead = true;
        this.dead_sync = true;
    }

    sendMessage(text) {
        this.messages.push(text);
    }

    isVictorious(winning_faction) {
        return (winning_faction == this.faction || ~winning_faction.indexOf(this.faction));
    }

    objectify(game) {
        console.log("Objectifying player , target", this.target && this.target.id);
        return {
            name: this.name,
            id: this.id,
            image: this.image,
            color: this.color,
            dead: this.dead_sync,
            active: this.active,
            role: this.role,
            messages: this.messages,
            vote: this.vote ? this.vote.id : null,
            won: this.won || false,
            target: this.target ? this.target.id : null
        }
    }
}

class Villager extends Player {

    init() {
        this.role = Role.VILLAGER;
        this.alignment = Alignment.GOOD;
        this.seer_result = Alignment.GOOD;
        this.faction = Faction.VILLAGE;

        this.witchImmune = true;
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
        this.faction = Faction.WEREWOLVES;

        this.witchImmune = false;
    }

    isActive(game) {

        if (game.NightPlayOrder[game.nightIndex] != this.role) return false;
        if (this.dead) return false;

        var wolves = game.players.filter(x => x.role == this.role && x.target != this.target && !x.dead);
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

class Jester extends Player {
    init() {
        this.role = Role.JESTER;
        this.alignment = Alignment.NEUTRAL;
        this.seer_result = Alignment.EVIL;
        this.faction = Faction.NEUTRAL;

        this.jester_win = false;
        this.haunting = false;
    }

    isActive(game) {
        console.log("Checking if jester is active");
        console.log(this.haunting);
        return game.NightPlayOrder[game.nightIndex] == this.role && this.target === null && this.haunting;
    }

    canPerformRole() {
        return this.haunting;
    }

    performRole() {
        console.log("Jester attacking");

        this.haunting = false;
        if (!this.target) return;

        this.target.attackers.push([this, Power.UNSTOPPABLE, "haunted by the jester"]);
    }

    execute() {
        super.execute();
        console.log("Executed a jester");
        this.jester_win = true;
        this.haunting = true;
    }
}

class Healer extends Player {
    init() {
        this.role = Role.HEALER;
        this.alignment = Alignment.GOOD;
        this.seer_result = Alignment.GOOD;
        this.faction = Faction.VILLAGE;

        this.witchImmune = false;
    }

    performRole() {
        if (!this.canPerformRole()) return;
        console.log(this.name, "healing", this.target.name);
        this.target.healers.push([this, Power.BASIC]);
    }
}

class Seer extends Player {
    init() {
        this.role = Role.SEER;
        this.alignment = Alignment.GOOD;
        this.seer_result = Alignment.GOOD;
        this.faction = Faction.VILLAGE;

        this.witchImmune = false;
    }

    setTarget(input, game) {
        if (input === true) {
            this.target = true;
        }
        else {
            var c = game.getClient(this.id);
            var p = game.getPlayer(input);
            if (c) {
                c.emit("seer_result", {seer_result: p ? game.getPlayer(input).seer_result : "GOOD"});
            }
        }
    }
}

class Witch extends Player {
    init() {
        this.role = Role.WITCH;
        this.alignment = Alignment.CHAOS;
        this.seer_result = Alignment.EVIL;
        this.faction = Faction.WITCH;

        this.witchImmune = true;

        this.setTarget = this.setTarget.bind(this);
    }

    resetNight() {
        super.resetNight();

        this.target = [];
    }

    isActive(game) {
        console.log("Checking if a witch is active");
        console.log("Current order", game.NightPlayOrder[game.nightIndex], "my order", this.role);
        console.log("am i dead", this.dead);
        console.log("Did i already play", this.target);
        return game.NightPlayOrder[game.nightIndex] == this.role && !this.dead && this.target !== false && this.target.length < 2;
    }

    setTarget(input, game) {
        if (input === false) {
            this.target = false;
            return;
        }
        var p = game.getPlayer(input);
        if (p != null && !p.dead) {
            this.target.push(p);
        }
    }

    canPerformRole(game) {
        return !this.dead && this.target && this.target.length == 2;
    }

    performRole() {
        this.target[0].sendMessage("You feel a mystical power dominating you... You were witched!");
        if (!this.target[0].witchImmune) {
            this.target[0].target = this.target[1];
            this.target[0].witched = true;
        }
    }
}

const RoleGenerators = dict(
    [Role.VILLAGER, Villager],
    [Role.WEREWOLF, Werewolf],
    [Role.HEALER, Healer],
    [Role.SEER, Seer],
    [Role.WITCH, Witch],
    [Role.JESTER, Jester]
)

const createPlayer = (id, name, image, color, role) => {
    var player = new (RoleGenerators[role])(id, name, image, color);
    player.init();
    return player;
};

export { createPlayer, Role };
