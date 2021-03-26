import { Player } from "../player";
import { Role, Alignment, Faction, Power } from "../../game-enums";

export class Priest extends Player {
  init() {
    this.role = Role.PRIEST;
    this.alignment = Alignment.GOOD;
    this.seer_result = Alignment.GOOD;
    this.faction = Faction.VILLAGE;

    this.witchImmune = false;

    this.abilities = 1;
  }

  performRole() {
    if (this.abilities > 0) {
      this.abilities--;
    } else {
      return;
    }

    if (!this.target.getVisited(this)) return;

    this.target.attackers.push([this, Power.BASIC, "attacked by a priest"]);
    this.target.sendMessage("You were attacked by a priest!");

    if (this.target.alignment == Alignment.GOOD) {
      this.attackers.push([null, Power.BASIC, "killed by a divine power"]);
      this.target.sendMessage("You will pay for your sins with your life!");
    }
  }
}
