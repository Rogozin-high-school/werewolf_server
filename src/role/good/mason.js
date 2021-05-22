import { Player } from "../player";
import { Role, Alignment, Faction } from "../../game-enums";

export class Mason extends Player {
  init() {
    this.role = Role.MASON;
    this.alignment = Alignment.GOOD;
    this.seer_result = Alignment.GOOD;
    this.faction = Faction.VILLAGE;

    this.witchImmune = true;
  }

  isActive(game) {
    if (game.nightPlayOrder[game.nightIndex] != "MASON") return false;
    if (this.dead) return false;

    return true;
  }
}
