import { dict, shuffle, randomOf, maxOf } from "./util";
import {
  State,
  Role,
  Faction,
  NightPlayOrder,
  NightCalculationOrder,
} from "./game-enums";
import { NightDetails, RandomRole, RoleSlotType } from "./roles";
import { createPlayer, convertPlayer } from "./role/player-utils";

export class GameRoom {
  constructor(roomId) {
    // Clients are all connected devices, players are the in-game characters.
    // While players can die or change role, clients are fixed.
    this.clients = [];
    this.players = [];

    this.nightPlayOrder = [];
    this.roomId = roomId;

    this.rolesBank = [
      RoleSlotType.WEREWOLF,
      RoleSlotType.HEALER,
      RoleSlotType.TOWN_INV,
      RoleSlotType.VILLAGER,
      RoleSlotType.SEER,
      RoleSlotType.FOOL,
      RoleSlotType.WEREWOLF,
      RoleSlotType.TOWN_ATCK,
      RoleSlotType.TOWN_INV,
      RoleSlotType.WOLF_RAND,
      RoleSlotType.TOWN_RAND,
      RoleSlotType.WITCH,
      RoleSlotType.TOWN_ATCK,
      RoleSlotType.TOWN_INV,
      RoleSlotType.ARSONIST,
      RoleSlotType.CREEPY_GIRL,
    ];

    this.reset();
  }

  onJoin(client) {
    console.log(client.id, "joined", this.roomId);

    if (this.state == State.LOBBY) {
      this.speak(client.nickname + " has joined the town");
    }

    this.syncClientList();
    this.syncGamestate();
    this.syncRolesList();
  }

  onLeave(client) {
    console.log(client.id, "left", this.roomId);

    if (this.state == State.LOBBY) {
      this.speak(client.nickname + " has left the town");
    }

    this.syncClientList();
    this.syncGamestate();
  }

  setTimer(millis) {
    if (!millis) this.unsetTimer();
    else this.timer = new Date().getTime() + millis;
  }

  unsetTimer() {
    this.timer = null;
  }

  /* 
    setState changes the room state and starts a timer for the next state update
    Args:
        newState - the state to transfer to
        timer - milliseconds to set the timer to
        timerHidden - if true, the timer in the GUI will be hidden in the new state
        noUpdate - if true, does not send the gamestate update to the clients on the current state update
    */
  setState(newState, timer, timerHidden, noUpdate) {
    this.state = newState;
    this.setTimer(timer);
    this.timer_shown = !timerHidden;

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
    const loopFunction = "onLoop_" + this.state;
    if (this[loopFunction]) {
      this[loopFunction]();
    }
  }

  onLoop_ROLE_SELECTION() {
    if (this.timerDue()) this.enterPregame();
  }

  onLoop_PRE_GAME() {
    if (this.timerDue()) this.startNightTransition();
  }

  onLoop_NIGHT_TRANSITION() {
    if (this.timerDue()) this.resetNight();
  }

  onLoop_NIGHT() {
    var active = this.players.filter((x) => x.active); // Getting cached active values

    if (
      (active.length == 0 || this.timerDue()) &&
      this.minTime <= new Date().getTime() &&
      !this.nightActionDone &&
      this.nightActionStarted
    ) {
      this.nightActionDone = true;

      this.unsetTimer();
      this.speak(
        NightDetails[this.nightPlayOrder[this.nightIndex]].end_message
      );

      setTimeout(() => {
        this.tryIncrementNightAction();
      }, 2000);
    }
  }

  tryIncrementNightAction() {
    console.log("No active players left, incrementing nightIndex");
    this.endNightAction();

    if (this.nightIndex < this.nightPlayOrder.length) {
      console.log(
        "Continuing to play. Current night order",
        this.nightPlayOrder[this.nightIndex]
      );
      this.startNightAction();
    } else {
      this.endNight();
    }
  }

  onLoop_DAY_TRANSITION() {
    if (this.timerDue()) {
      this.setState(State.DAY_CALLOUTS, 1);
    }
  }

  onLoop_DAY_CALLOUTS() {
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
      this.speak(
        "The town could not decide whether to lych " + this.player_on_stand.name
      );
      this.trialInnocent();
    }
  }

  onLoop_EXECUTION() {
    if (this.timerDue()) {
      this.player_on_stand.execute();
      this.player_on_stand = null;

      if (!this.calculateVictoryAndTerminateGame()) {
        this.startNightTransition();
      }
    }
  }

  onLoop_GAME_OVER() {
    if (this.timerDue()) {
      this.reset();
      this.setState(State.LOBBY);
    }
  }

  endNight() {
    this.nextDayCallouts = [];
    this.calculateNightActions();
    this.calculateWerewolfKill();

    this.callouts = this.calculateNightDeaths() || [
      "No one was killed tonight",
    ];
    for (var c of this.nextDayCallouts) this.callouts.push(c);

    this.calculatePromotions();
    this.calculateConversions();

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
    for (var player of this.players.filter((x) => !x.dead_sync)) {
      var c = this.getClient(player.id);
      if (c) c.emit("open_messages", player.messages);
    }
  }

  nextDayCallout() {
    var callout = this.callouts.shift();
    if (!callout) {
      if (!this.calculateVictoryAndTerminateGame()) {
        this.setState(State.DISCUSSION, 60 * 1000 * 3.5);
      }
    } else if (callout.constructor.name == "String") {
      this.speak(callout);
      this.message = callout;
      this.syncGamestate();
      this.setTimer(5000);
    } else if (callout.constructor.name == "Array") {
      if (callout[0] == "deadsync") {
        callout[1].dead_sync = callout[1].dead;
      }
      setTimeout(this.nextDayCallout.bind(this), 1);
    }
  }

  getRole(roleOpts) {
    if (roleOpts.constructor.name == "String") {
      if (RandomRole[roleOpts]) {
        return randomOf(RandomRole[roleOpts]);
      } else return roleOpts;
    } else return randomOf(roleOpts);
  }

  startRoleSelection() {
    this.calculateNightOrder();
    this.speak("Players, prepare for your roles!");

    // Shuffling the roles deck (cards deck)
    var deck = this.rolesBank.slice(0, this.clients.length);
    for (var i = 0; i < 100; i++) {
      shuffle(deck);
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
    var r = [Role.WEREWOLF, Role.WITCH, "SPOOKY_DOLL"];

    console.log(this.rolesBank);
    for (var role of this.rolesBank) {
      if (role.constructor.name == "String") {
        if (RandomRole[role]) {
          for (var rrole of RandomRole[role]) {
            if (!~r.indexOf(rrole)) {
              r.push(rrole);
            }
          }
        } else if (!~r.indexOf(role)) {
          r.push(role);
        }
      } else {
        for (var rrole of role) {
          if (!~r.indexOf(rrole)) {
            r.push(rrole);
          }
        }
      }
    }

    this.nightPlayOrder.length = 0;
    for (var play of NightPlayOrder) {
      if (~r.indexOf(play)) {
        this.nightPlayOrder.push(play);
      }
    }
    if (this.nightPlayOrder.length == 0) {
      this.nightPlayOrder.push(Role.WEREWOLF);
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
    console.log("Looking for active players");
    var ps = [];
    for (var p of this.players) {
      if (p.__isActive(this)) {
        p.active = true;
        ps.push(p);
      } else {
        p.active = false;
      }
    }
    return ps;
  }

  calculatePromotions() {
    var player_list_changed = false;

    // Promoting a werewolf team member to being a werewolf
    if (
      this.players.filter((x) => !x.dead && x.role == Role.WEREWOLF).length == 0
    ) {
      var nonwws = this.players.filter(
        (x) => !x.dead && x.faction == Faction.WEREWOLVES
      );
      if (nonwws.length > 0) {
        shuffle(nonwws);
        nonwws[0].setRole(Role.WEREWOLF);
        nonwws[0].sendMessage(
          "All werewolves have died so you have become a werewolf!"
        );

        player_list_changed = true;
      }
    }

    return player_list_changed;
  }

  calculateConversions() {
    for (var pi in this.players) {
      if (this.players[pi].convert) {
        this.players[pi] = convertPlayer(
          this.players[pi],
          this.players[pi].convert
        );
      }
    }
  }

  calculateWerewolfKill() {
    var witched = false;

    for (var ww of this.players.filter(
      (x) => x.role == Role.WEREWOLF && x.target && x.witched
    )) {
      if (ww.target != target) {
        ww.werewolfKill(ww.target);
        witched = true;
      }
    }

    if (witched) return; // If a werewolf got witched, they will attack INSTEAD the witch target
    // instead of the voting target

    var wwVotes = this.players
      .filter((x) => x.role == Role.WEREWOLF && x.target && !x.witched)
      .map((x) => x.target);
    var votes = [...new Set(wwVotes)].map((y) => [
      y,
      wwVotes.filter((n) => n == y).length,
    ]); // Counting the votes
    var targets = [];
    for (var vote of votes) {
      if (targets.length == 0 || targets[0][1] == vote[1]) {
        targets.push(vote);
      } else if (targets[0][1] < vote[1]) {
        targets.length = 0;
        targets.push(vote);
      }
    }

    var target = null;

    if (targets.length != 0) {
      target = randomOf(targets)[0];
      var attacker = randomOf(
        this.players.filter(
          (x) => x.role == Role.WEREWOLF && x.target == target
        )
      );
      attacker.werewolfKill(target);
    }
  }

  calculateNightActions() {
    console.log("Calculating night actions");

    for (var player of this.players) {
      // Giving the doll away
      player.calculateDollTransfer();
    }

    for (var role of NightCalculationOrder) {
      console.log("Order:", role);
      for (var player of this.players.filter((x) => x.role == role)) {
        if (player.canPerformRole(this)) {
          player.performRole(this);
        }
      }
    }
  }

  calculateNightDeaths() {
    var day_callouts = [];
    for (var player of this.players.filter((x) => !x.dead)) {
      var data = player.calculateKill(this);
      if (data) {
        day_callouts.push(...data);
      }
    }

    var killsTonight = this.players.filter((x) => x.dead && !x.dead_sync);
    console.log("This night kills:", killsTonight);
    if (killsTonight.length > 0) {
      this.nights_no_kill = 0;
    } else {
      this.nights_no_kill++;
    }

    console.log("Nights with no killing", this.nights_no_kill);

    return day_callouts;
  }

  syncClientList() {
    var clients = this.clients.map((x) => {
      return {
        name: x.nickname,
        id: x.id,
        image: x.image,
        color: x.color,
      };
    });

    for (var client of this.clients) {
      client.emit("state", { clients });
    }
  }

  syncRolesList() {
    var gameState = {
      roles: this.rolesBank,
    };

    for (var client of this.clients) {
      client.emit("state", gameState);
    }
  }

  syncGamestate() {
    var gameState = {
      phase: this.state,
      players: this.players.map((x) => x.objectify(this)),
      timer: this.timer_shown ? this.timer : null,
      message: this.message || null,
      player_on_stand: this.player_on_stand
        ? this.player_on_stand.objectify(this)
        : null,
      winning_faction:
        this.winningFaction && this.winningFaction.constructor.name == "String"
          ? this.winningFaction
          : "DRAW",
      night_index: this.nightPlayOrder[this.nightIndex],
    };

    for (var client of this.clients) {
      client.emit("state", gameState);
    }
  }

  speak(message) {
    if (this.clients.length > 0) this.clients[0].emit("speak", message);
  }

  // Initializes the room as if the lobby phase started right now
  reset() {
    this.state = State.LOBBY;
    this.timer = null;
    this.timer_shown = false;

    this.night = 0;

    this.minTime = 0;

    this.player_on_stand = null;

    this.winningFaction = null;

    this.nights_no_kill = 0;

    this.players.length = 0;
  }

  // Sets the game up for a new
  resetNight() {
    this.nightIndex = 0;
    this.nightActionStarted = false;
    this.nextDayCallouts = [];
    this.setState(State.NIGHT, null, null, true);

    for (var p of this.players) {
      p.resetNight();
    }

    this.startNightAction();
  }

  startNightAction() {
    console.log(
      "Starting night action",
      this.nightPlayOrder,
      this.nightPlayOrder[this.nightIndex]
    );
    var filter = NightDetails[this.nightPlayOrder[this.nightIndex]].should_play;
    if (filter && !filter(this)) {
      this.tryIncrementNightAction(); // recursive but it's ok by me
      return;
    }

    var active = this.getActivePlayers();
    this.nightActionDone = false;
    this.nightActionStarted = true;

    this.minTime = new Date().getTime() + Math.random() * 9000;
    this.setTimer(NightDetails[this.nightPlayOrder[this.nightIndex]].timer);

    this.syncGamestate();
    this.speak(
      NightDetails[this.nightPlayOrder[this.nightIndex]].summon_message
    );
  }

  endNightAction() {
    this.nightActionStarted = false;
    this.nightIndex++;
  }

  clearDoll() {
    for (var p of this.players) {
      p.holds_doll = false;
    }
  }

  __msg__add_role(client, data) {
    if (Role[data] || RandomRole[data]) {
      this.rolesBank.push(data);
      this.syncRolesList();
    }
  }

  __msg__remove_role(client, data) {
    if (data < this.rolesBank.length) {
      this.rolesBank.splice(data, 1);
      this.syncRolesList();
    }
  }

  __msg__set_preset(client, data) {
    this.rolesBank = data;
    this.syncRolesList();
  }

  __msg__start_game(client, data) {
    console.log("Received START_GAME");
    if (this.state != State.LOBBY) return; // Can only start game while in lobby
    if (client.id != this.clients[0].id) return; // Only the host can start the game
    if (this.rolesBank.length < this.clients.length) return; // Not enough role cards to start?

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
      if (this.nightPlayOrder[this.nightIndex] == "SPOOKY_DOLL") {
        p.setDollGive(data, this);
      } else {
        p.setTarget(data, this);
      }
    }

    this.getActivePlayers();
    this.syncGamestate();
  }

  __msg__set_vote(client, data) {
    if (this.state != State.DISCUSSION) return;

    var p = this.getPlayer(client.id);
    var t = this.getPlayer(data);

    if (p.dead || t.dead) return;

    if (p.id == t.id || (p.vote && p.vote.id == t.id)) {
      p.vote = null;
    } else {
      p.vote = t;
    }

    if (
      this.players.filter((x) => !x.dead && x.vote == t).length >
      this.players.filter((x) => !x.dead).length / 2
    ) {
      this.setTrial(t);
    }

    this.syncGamestate();
  }

  __msg__trial_innocent(client) {
    if (this.state != State.TRIAL) return; // Can only take this action in the TRIAL state
    if (client.id != this.clients[0].id) return; // Only host can execute/free accusees

    this.speak(
      "The town has decided to set " + this.player_on_stand.name + " free."
    );

    this.trialInnocent();
  }

  __msg__trial_guilty(client) {
    if (this.state != State.TRIAL) return; // Can only take this action in the TRIAL state
    if (client.id != this.clients[0].id) return; // Only host can execute/free accusees

    this.speak(
      "The town has decided to execute " +
        this.player_on_stand.name +
        ". May god have mercy on your soul"
    );

    this.trialGuilty();
  }

  __msg__skip_day(client) {
    if (this.state != State.DISCUSSION) return; // Can only take this action in the DISCUSSION state
    if (client.id != this.clients[0].id) return; // Only host can skip day

    this.startNightTransition();
  }

  setTrial(player) {
    console.log(player.name, "is now on trial");

    this.discussion_timer = this.timer - new Date().getTime(); // Preserving the discussion timer

    this.player_on_stand = player;
    this.message =
      player.name +
      ", you are on trial for conspiracy against the town. What say you?";

    this.speak(
      "The town has decided to put " + this.player_on_stand.name + " on trial."
    );

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
    var p = this.players.filter((x) => x.id == id);
    if (p.length == 0) return null;
    return p[0];
  }

  getClient(id) {
    var c = this.clients.filter((x) => x.id == id);
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
    var alive = this.players.filter((x) => !x.dead);
    var village = alive.filter((x) => x.faction == Faction.VILLAGE);
    var priests = village.filter((x) => x.role == Role.PRIEST);
    var werewolves = alive.filter((x) => x.faction == Faction.WEREWOLVES);
    var neutral = alive.filter((x) => x.faction == Faction.NEUTRAL);
    var witches = alive.filter((x) => x.role == Role.WITCH);
    var witch_team = alive.filter((x) => x.faction == Faction.WITCH);
    var arsonists = alive.filter((x) => x.faction == Faction.ARSONIST);

    var fools_won = this.players.filter(
      (x) => x.fool_win && x.role == Role.FOOL && x.dead
    );

    console.log("Alive players,", alive.length);
    console.log("Village", village.length);
    console.log("WWs", werewolves.length);
    console.log("Fools won", fools_won);

    var healers = alive.filter((x) => x.role == Role.HEALER);

    if (alive.length == 0) {
      console.log("Returning DRAW");
      return "DRAW";
    }

    if (fools_won.length > 0) {
      return Faction.FOOL;
    }

    if (neutral.length == alive.length) {
      console.log("Returning neutral players victory");
      return Faction.NEUTRAL;
    }

    if (village.length + neutral.length == alive.length) {
      console.log("The village has won (only village players)");
      return Faction.VILLAGE;
    }

    if (werewolves.length + neutral.length == alive.length) {
      console.log("Werewolves won");
      return Faction.WEREWOLVES;
    }

    if (witch_team.length + neutral.length == alive.length) {
      console.log("Witch has won");
      return Faction.WITCH;
    }

    if (arsonists.length + neutral.length == alive.length) {
      console.log("Arsonist has won");
      return Faction.ARSONIST;
    }

    // Uncalculated stalemate prevention
    // If there are three nights with no kills, game will stale and a draw will be announced
    if (this.night >= 3 && this.nights_no_kill >= 3) {
      return "NOKILL";
    }

    // Witch vs town delayed victory
    // If witch is against 1 town (with no WWs), if the town does not have
    // killing roles such as priests, witch should immediately lose
    // if (priests. == 3) {
    //     return Faction.VILLAGE;
    // }

    // witch vs ww delayed victory
    // In case of 1 witch + 1 ww, no-one can lynch the other.
    // In the following night, the witch witches the ww to kill themselves and wins.
    if (witches.length == 1 && werewolves.length == 1 && alive.length == 2) {
      console.log("Witch+WW witch wins");
      return Faction.WITCH;
    }

    // WW vs healer stalemate
    // If 1 ww + 1 healer are alive, draw should be immediately called
    if (healers.length == 1 && werewolves.length == 1 && alive.length == 2) {
      console.log("Returning healer+ww tie");
      return [Faction.VILLAGE, Faction.WEREWOLVES];
    }

    return null;
  }

  /*
  If there is a victorious faction, this function sets the game state to GAME_OVER and terminates the game.
  */
  calculateVictoryAndTerminateGame() {
    var winningFaction = this.getWinningFaction();
    if (!winningFaction) {
      return false;
    }

    for (var p of this.players) {
      p.won = p.isVictorious(winningFaction);
    }

    this.winningFaction = winningFaction;
    this.setState(State.GAME_OVER, 30000);
    return true;
  }
}
