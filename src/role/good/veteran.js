import { Player } from "../player";
import { Role, Alignment, Faction, Power } from "../../game-enums";

export class Veteran extends Player {
  init() {
    this.role = Role.VETERAN;
    this.alignment = Alignment.GOOD;
    this.seer_result = Alignment.EVIL; // Veteran is seen as evil by the seer
    this.faction = Faction.VILLAGE;

    this.witchImmune = true;

    this.alerts_left = 3;
  }

  resetNight(game) {
    super.resetNight(game);

    this.alert = false;
  }

  setTarget(target) {
    if (target) {
      if (this.alerts_left) {
        this.target = true;
      }
    } else {
      this.target = false;
    }
  }

  performRole() {
    if (this.target && this.alerts_left > 0) {
      this.alert = true;
      this.alerts_left--;
    }
  }

  getVisited(visitor) {
    super.getVisited(visitor);

    if (this.alert) {
      visitor.attackers.push([this, Power.POWERFUL, "shot by a veteran"]);
      visitor.sendMessage("You were shot by the veteran you visited!");
      this.sendMessage("You shot someone who visited you");
      return false;
    }

    return true;
  }
}
