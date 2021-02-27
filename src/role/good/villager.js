import { Player } from "../player";
import { Role, Alignment, Faction } from '../../game-enums';

export class Villager extends Player {

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