import { Player } from "../player";
import { Role, Alignment, Faction } from '../../game-enums';

export class Spy extends Player {
    init() {
        this.role = Role.SPY;
        this.alignment = Alignment.GOOD;
        this.seer_result = Alignment.GOOD;
        this.faction = Faction.VILLAGE;

        this.witchImmune = false;
    }

    performRole() {
        if (!this.canPerformRole()) return;
        if (!this.target.getVisited(this)) return;
        
        for (var visitor of this.target.visitors.filter(x => x.role != Role.SPY)) {
            this.sendMessage(visitor.name + " has visited your target");
        }
    }
}