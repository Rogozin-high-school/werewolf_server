import { Player } from "../player";
import { Role, Alignment, Faction, Power } from '../../game-enums';

export class Arsonist extends Player {
    init() {
        this.role = Role.ARSONIST;
        this.alignment = Alignment.CHAOS;
        this.seer_result = Alignment.EVIL;
        this.faction = Faction.ARSONIST;

        this.witchImmune = true;
    }

    setTarget(input, game) {
        var p = game.getPlayer(input);
        if (p) {
            this.target = p;
        }
        else {
            this.target = true;
        }
    }

    performRole(game) {

        if (!this.canPerformRole()) return;

        if (this.target == true) {
            // Igniting
            for (var p of game.players.filter(x => x.doused)) {
                p.attackers.push([this, Power.POWERFUL, "incinerated by an arsonist"]);
                this.sendMessage("You burned someone");
            }
        }
        else if (this.target == this) {
            this.doused = false;
        }
        else if (this.target) {
            if (!this.target.getVisited(this)) return;

            this.target.doused = true;
        }
    }
}