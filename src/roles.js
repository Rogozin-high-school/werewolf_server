import { Role, Faction } from "./game-enums";

export const NightDetails = {
  [Role.WEREWOLF]: {
    summon_message: "Werewolves, wake up. Pick a player to attack.",
    end_message: "Good night, werewolves.",
    timer: 30000,
    should_play: function (game) {
      // Werewolves play only if there are any left. Otherwise, they are not summoned.
      // This is intentional. This lets other factions know if the werewolves are all killed
      return (
        game.players.filter((x) => x.faction == Faction.WEREWOLVES).length > 0
      );
    },
  },
  [Role.MASON]: {
    summon_message: "Mason, wake up. Find your partner.",
    end_message: "Good night, Mason.",
    timer: 10000,
  },
  [Role.HEALER]: {
    summon_message: "Healer, wake up. Pick a player to heal.",
    end_message: "Good night, healer.",
    timer: 10000,
  },
  [Role.SEER]: {
    summon_message: "Fortune teller, wake up. Pick a player to check.",
    end_message: "Good night, fortune teller.",
    timer: 10000,
  },
  [Role.WITCH]: {
    summon_message: "Witches, wake up. Pick a player to cast your spells on.",
    end_message: "Good night, witches.",
    timer: 20000,
    should_play: function (game) {
      return (
        game.players.filter(
          (x) => x.role == Role.WITCH || x.role == Role.DEATH_WITCH
        ).length > 0
      );
    },
  },
  [Role.JESTER]: {
    summon_message: "Jester, wake up. Pick a player to haunt.",
    end_message: "Good night, jester.",
    timer: 10000,
    should_play: function (game) {
      return (
        game.players.filter((x) => x.role == Role.JESTER && x.haunting).length >
        0
      );
    },
  },
  [Role.VETERAN]: {
    summon_message: "Veteran, wake up. Would you like to stay on alert?.",
    end_message: "Good night, veteran.",
    timer: 10000,
  },
  [Role.PRIEST]: {
    summon_message: "Priest, wake up. Pick a player to kill.",
    end_message: "Good night, priest.",
    timer: 10000,
  },
  [Role.SPY]: {
    summon_message: "Spy, wake up. Pick a player to follow.",
    end_message: "Good night, spy.",
    timer: 10000,
  },
  [Role.INVESTIGATOR]: {
    summon_message: "Investigator, wake up. Pick a player to investigate.",
    end_message: "Good night, investigator.",
    timer: 10000,
  },
  [Role.ARSONIST]: {
    summon_message:
      "Arsonist, wake up. Pick a player to douse or ignite all doused players.",
    end_message: "Good night, arsonist.",
    timer: 10000,
  },
  [Role.CREEPY_GIRL]: {
    summon_message: "Creepy Girl, wake up. Pick a player to pass your doll to.",
    end_message: "Good night, creepy girl.",
    timer: 10000,
    should_play: function (game) {
      // The creepy girl plays only on the first night
      return (
        game.players.filter((x) => x.role == Role.CREEPY_GIRL).length &&
        game.night == 1
      );
    },
  },
  [Role.SPOOKY_DOLL]: {
    summon_message:
      "Player with the spooky doll, wake up. Pick a player to pass the doll to.",
    end_message: "Good night, spooky doll.",
    timer: 15000,
    should_play: function (game) {
      return game.players.filter((x) => x.holds_doll).length && game.night > 1;
    },
  },
};

export const RoleSlotType = {
  ...Role,
  TOWN_INV: "TOWN_INV",
  TOWN_RAND: "TOWN_RAND",
  TOWN_ATCK: "TOWN_ATCK",
  WOLF_RAND: "WOLF_RAND",
  RANDOM: "RANDOM",
};

export const RandomRole = {
  [RoleSlotType.TOWN_INV]: [Role.SEER, Role.SPY, Role.INVESTIGATOR],
  [RoleSlotType.TOWN_RAND]: [
    Role.VILLAGER,
    Role.HEALER,
    Role.SEER,
    Role.PRIEST,
    Role.VETERAN,
    Role.SPY,
    Role.INVESTIGATOR,
    Role.MASON,
  ],
  [RoleSlotType.TOWN_ATCK]: [Role.VETERAN, Role.PRIEST],
  [RoleSlotType.WOLF_RAND]: [Role.WEREWOLF, Role.WOLF_SEER],
  [RoleSlotType.RANDOM]: [
    Role.VILLAGER,
    Role.HEALER,
    Role.SEER,
    Role.SPY,
    Role.INVESTIGATOR,
    Role.VETERAN,
    Role.PRIEST,
    Role.WEREWOLF,
    Role.WOLF_SEER,
    Role.WITCH,
    Role.CREEPY_GIRL,
    Role.ARSONIST,
    Role.JESTER,
    Role.Fool,
    Role.MASON,
  ],
};
