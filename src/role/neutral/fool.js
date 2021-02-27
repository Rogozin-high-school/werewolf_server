import { Player } from '../player';
import { Role, Alignment, Faction } from '../../game-enums';

export class Fool extends Player {
    init() {
        this.role = Role.FOOL;
        this.alignment = Alignment.NEUTRAL;
        this.seer_result = Alignment.EVIL;

        this.faction = Faction.FOOL;
    }

    execute() {
        super.execute();

        console.log("Fool was executed");
        this.fool_win = true;
    }

    isVictorious(winning_faction) {
        return winning_faction == Faction.FOOL && this.dead && this.fool_win;
    }
}