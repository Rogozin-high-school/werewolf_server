import { Player } from "../player";
import { Role, Alignment, Faction } from '../../game-enums';

export class WolfSeer extends Player {
    init() {
        this.role = Role.WOLF_SEER;
        this.faction = Faction.WEREWOLVES;
        this.alignment = Alignment.EVIL;
        this.seer_result = Alignment.EVIL;

        this.witchImmune = false;
    }

    isActive(game) {
        if (game.nightPlayOrder[game.nightIndex] != "WEREWOLF") return false;
        if (this.dead) return false;
        if (this.target != null) return false;

        return true;
    }

    performRole() {
        if (!this.canPerformRole()) return;
        if (!this.target.getVisited(this)) return;

        this.sendMessage(WolfSeerResults[this.target.role] || "Your target's role could not be determined");
    }
}