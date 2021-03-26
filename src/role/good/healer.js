import { Player } from "../player";
import { Role, Alignment, Faction, Power } from "../../game-enums";

export class Healer extends Player {
  init() {
    this.role = Role.HEALER;
    this.alignment = Alignment.GOOD;
    this.seer_result = Alignment.GOOD;
    this.faction = Faction.VILLAGE;

    this.witchImmune = false;
  }

  performRole() {
    if (!this.target.getVisited(this)) return;
    this.target.healers.push([this, Power.BASIC]);
  }
}
