import { Player } from "../player";
import { Role, Alignment, Faction, Power } from '../../game-enums';

export class Werewolf extends Player {
    init() {
        this.role = Role.WEREWOLF;
        this.alignment = Alignment.EVIL;
        this.seer_result = Alignment.EVIL;
        this.faction = Faction.WEREWOLVES;

        this.witchImmune = false;
    }

    isActive(game) {

        if (game.nightPlayOrder[game.nightIndex] != "WEREWOLF") return false;
        if (this.dead) return false;

        var wolves = game.players.filter(x => x.role == this.role && x.target != this.target && !x.dead);
        if (wolves.length == 0 && this.target != null) return false;

        return true;
    }

    werewolfKill(target) {
        if (this.canPerformRole()) {
            if (!target.getVisited(this)) return;
            target.attackers.push([this, Power.BASIC, "attacked by a werewolf"]);
        }
    }
}