import { Player } from "../player";
import { Role, Alignment, Faction, Power } from "../../game-enums";

export class DeathWitch extends Player {
  init() {
    this.role = Role.DEATH_WITCH;
    this.alignment = Alignment.CHAOS;
    this.seer_result = Alignment.EVIL;
    this.faction = Faction.WITCH;

    this.witchImmune = true;
  }

  isActive(game) {
    return (
      !this.dead &&
      game.nightPlayOrder[game.nightIndex] == Role.WITCH &&
      this.target == null
    );
  }

  isVictorious(winning_faction) {
    return (
      (winning_faction == this.faction ||
        ~winning_faction.indexOf(this.faction)) &&
      !this.dead
    );
    // Witches have to be alive to win
  }

  performRole() {
    if (!this.target.getVisited(this)) return;

    this.target.attackers.push([this, Power.POWERFUL, "cursed by a witch"]);
    this.sendMessage("You have cursed your target");
  }
}
