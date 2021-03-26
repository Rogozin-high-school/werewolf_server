import { Role } from "../game-enums";
import { maxOf } from "../util";

export class Player {
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
        this.visitors = [];

        this.messages = [];
        this.vote = null;

        this.won = false;
        
        this.convert = null;
    }

    init() { }
    performRole() { }

    resetNight() {
        this.target = null;

        this.attackers.length = 0;
        this.healers.length = 0;
        this.visitors.length = 0;
        this.messages.length = 0;

        this.witched = false; // For witch action

        this.convert = null; // For changing player's roles.
        this.doll_giveto = null; // For passing on the doll
    }

    resetDay() {
        this.vote = null;
    }

    setRole(role) {
        this.convert = role;
    }

    isActive(game) {
        console.log("Checking if", this.name, "is active");
        console.log("Current order", game.nightPlayOrder[game.nightIndex], "my order", this.role);
        console.log("am i dead", this.dead);
        console.log("Did i already play", this.target);
        return game.nightPlayOrder[game.nightIndex] == this.role && !this.dead && this.target === null;
    }

    isActive__doll(game) {
        return game.nightPlayOrder[game.nightIndex] == Role.SPOOKY_DOLL && !this.dead && this.holds_doll && this.doll_giveto == null;
    }

    __isActive(game) {
        return this.isActive(game) || this.isActive__doll(game);
    }

    setDollGive(input, game) {
        console.log("Setting doll give");
        if (input === false) {
            this.doll_giveto = false;
            return;
        }
        var p = game.getPlayer(input);
        if (p != null && !p.dead) {
            this.doll_giveto = p;
        }
    }

    giveDoll() {
        if (this.doll_giveto) {
            this.doll_giveto.holds_doll = true;
            this.holds_doll = false;
            this.doll_giveto.sendMessage("You have been given the spooky doll");
        }
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

    calculateKill(game) {
        var attack = this.attackers.length ? maxOf(this.attackers, x => x[1]) : null;
        var defense = this.healers.length ? maxOf(this.healers, x => x[1]) : null;

        if (attack) {
            if (!defense || attack[1] > defense[1]) {

                if (this.holds_doll)
                {
                    // Exception - if the player holds the doll, they don't die.
                    if (this.holds_doll) {
                        game.clearDoll();
                        var creepyGirl = game.players.filter(x => x.role == Role.CREEPY_GIRL && !x.dead);
                        if (creepyGirl.length) {
                            for (var girl of creepyGirl) {
                                girl.setRole(Role.DEATH_WITCH);
                                girl.sendMessage("Your doll has been taken to the grave, and you are now a Death Witch!");
                            }
                            game.custom_callouts.push("The spooky doll has vanished.");
                        }
                    }
                }
                else
                {
                    // Killed
                    this.kill(game);
                    this.sendMessage("You have died!");

                    var callouts = ["Tonight, we found " + this.name + ", dead in their home."];
                    for (var a in this.attackers) {
                        callouts.push((a == 0 ? "They were apparently " : "They were also ") + 
                                        (this.attackers[a][2] || "attacked."));
                    }
                    callouts.push(["deadsync", this]);
                    callouts.push("Rest in peace, " + this.name);
                    return callouts;
                }
            }
            else {
                this.sendMessage("Someone attacked you but you were saved!")
                var callouts = [this.name + " was apparently attacked tonight, but they survived"];
                return callouts;
            }
        }
    }

    /*
    True means that the visit is possible
    False means the visit is impossible or rejected by a player's special ability (veteran)
    */
    getVisited(visitor) {
        this.visitors.push(visitor);
        return true; // Regular players don't do much when visited.
    }

    kill() {
        this.dead = true;
    }

    // Execute kills the player by vote
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

    objectify() {
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
