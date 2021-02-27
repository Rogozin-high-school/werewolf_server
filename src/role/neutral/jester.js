import { Player } from "../player";
import { Role, Alignment, Faction, Power } from '../../game-enums';

export class Jester extends Player {
    init() {
        this.role = Role.JESTER;
        this.alignment = Alignment.NEUTRAL;
        this.seer_result = Alignment.EVIL;
        this.faction = Faction.NEUTRAL;

        this.jester_win = false;
        this.haunting = false;
    }

    isActive(game) {
        return game.nightPlayOrder[game.nightIndex] == this.role && this.target === null && this.haunting;
    }

    canPerformRole() {
        return this.haunting;
    }

    performRole() {
        console.log("Jester attacking");

        this.haunting = false;
        if (!this.target) return;

        this.target.getVisited(this); // The jester can attack no matter what. We don't take the return value

        this.target.attackers.push([this, Power.UNSTOPPABLE, "haunted by the jester"]);
        this.target.sendMessage("In your dream... You saw a Jester! Then a bright white light...")
    }

    execute() {
        super.execute();
        console.log("Executed a jester");
        this.jester_win = true;
        this.haunting = true;
    }

    isVictorious(winning_faction) {
        return this.dead && this.jester_win; // Todo: Check this one
    }
}