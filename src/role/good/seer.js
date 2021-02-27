import { Player } from "../player";
import { Role, Alignment, Faction } from '../../game-enums';

export class Seer extends Player {
    init() {
        this.role = Role.SEER;
        this.alignment = Alignment.GOOD;
        this.seer_result = Alignment.GOOD;
        this.faction = Faction.VILLAGE;

        this.witchImmune = false;
    }

    resetNight() {
        super.resetNight();
        this.seen_player = null;
    }
    
    // TODO: Inform the players that the Seer is also witch immune!!!!!!!

    setTarget(input, game) {
        if (input === true) {
            this.target = this.seen_player;
        }
        else {
            var c = game.getClient(this.id);
            var p = game.getPlayer(input);
            this.seen_player = p;
            if (c) {
                c.emit("seer_result", {seer_result: p ? game.getPlayer(input).seer_result : "GOOD"});
            }
        }
    }

    performRole() {
        this.target.getVisited(this); // Action was already done. We just get the counter attacks from our target here
    }
}