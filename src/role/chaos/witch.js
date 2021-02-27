import { Player } from "../player";
import { Role, Alignment, Faction } from '../../game-enums';

export class Witch extends Player {
    init() {
        this.role = Role.WITCH;
        this.alignment = Alignment.CHAOS;
        this.seer_result = Alignment.GOOD;
        this.faction = Faction.WITCH;

        this.witchImmune = true;

        this.setTarget = this.setTarget.bind(this);
    }

    isVictorious(winning_faction) {
        return (winning_faction == this.faction || ~winning_faction.indexOf(this.faction)) && !this.dead;
        // Witches have to be alive to win
    }

    resetNight() {
        super.resetNight();

        this.target = [];
    }

    isActive(game) {
        // console.log("Checking if a witch is active");
        // console.log("Current order", game.nightPlayOrder[game.nightIndex], "my order", this.role);
        // console.log("am i dead", this.dead);
        // console.log("Did i already play", this.target);
        return game.nightPlayOrder[game.nightIndex] == this.role && !this.dead && this.target !== false && this.target.length < 2;
    }

    /*
    setTarget is called twice for a witch (corresponds to two clicks in the UI),
    the first time with the witched player, and the second time with the witch target.

    Do not try to call this function with two parameters (witched player, target). This will not work.
    */
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

        if (!this.canPerformRole()) return;

        if (!this.target[0].getVisited(this)) {
            this.target[0].sendMessage("A witch has tried to control you but you attacked her instead!");
            this.sendMessage("It seems like your target is immune to your spells!");
            return;
        }

        if (!this.target[0].witchImmune) {
            // this.target[0].sendMessage("You feel a mystical power dominating you... You were witched!");
            this.sendMessage("You witched your target.")
            this.target[0].target = this.target[1];
            this.target[0].witched = true;
        }
    }
}