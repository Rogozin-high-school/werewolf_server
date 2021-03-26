import { Player } from "../player";
import { Role, Alignment, Faction } from "../../game-enums";

export class CreepyGirl extends Player {
  init() {
    this.role = Role.CREEPY_GIRL;
    this.alignment = Alignment.CHAOS;
    this.seer_result = Alignment.GOOD;

    this.faction = Faction.WITCH;

    this.witchImmune = true;

    this.holds_doll = true; // The creepy girl starts with the doll N0
  }

  performRole() {
    if (!this.target.getVisited(this)) return;

    this.holds_doll = false;
    this.target.holds_doll = true;
    this.target.sendMessage(
      "You have been given the spooky doll by the creepy girl"
    );
  }

  kill(game) {
    this.dead = true;

    game.clearDoll();
    game.custom_callouts.push("The spooky doll has vanished.");
  }
}
