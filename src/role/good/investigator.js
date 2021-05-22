import { Player } from "../player";
import { Role, Alignment, Faction } from "../../game-enums";

export class Investigator extends Player {
  init() {
    this.role = Role.INVESTIGATOR;
    this.alignment = Alignment.GOOD;
    this.seer_result = Alignment.GOOD;
    this.faction = Faction.VILLAGE;

    this.witchImmune = false;
  }

  performRole() {
    if (!this.target.getVisited(this)) return;

    if (this.target.holds_doll) {
      this.sendMessage("Your target could be a Fortune Teller, Spy or Witch");
      return;
    }

    if (this.target.doused) {
      this.sendMessage("Your target could be a Villager, Arsonist or Veteran");
      return;
    }

    switch (this.target.role) {
      case Role.VILLAGER:
      case Role.MASON:
      case Role.ARSONIST:
      case Role.VETERAN:
        this.sendMessage(
          "Your target could be a Villager, Mason, Arsonist or Veteran"
        );
        break;
      case Role.DEATH_WITCH:
      case Role.WEREWOLF:
      case Role.PRIEST:
        this.sendMessage(
          "Your target could be a Death Witch, Werewolf or Priest"
        );
        break;
      case Role.SEER:
      case Role.SPY:
      case Role.WITCH:
        this.sendMessage("Your target could be a Fortune Teller, Spy or Witch");
        break;
      case Role.JESTER:
      case Role.WOLF_SEER:
      case Role.HEALER:
        this.sendMessage("Your target could be a Jester, Wolf Seer or Healer");
        break;
      case Role.INVESTIGATOR:
      case Role.FOOL:
      case Role.CREEPY_GIRL:
        this.sendMessage(
          "Your target could be an Investigator, Fool or Creepy Girl"
        );
      default:
        this.sendMessage("Your target's role could not be determined");
        break;
    }
  }
}
