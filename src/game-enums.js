/*
Adding a role:

* Add it to the Role enum
* Add it to the wolf seer results
* Add it to the NightPlayOrder and NightCalculationOrder

*/

import { dict } from "./util";

export const State = {
    LOBBY: "LOBBY",
    ROLE_SELECTION: "ROLE_SELECTION",
    PRE_GAME: "PRE_GAME",
    NIGHT_TRANSITION: "NIGHT_TRANSITION",
    NIGHT: "NIGHT",
    DAY_TRANSITION: "DAY_TRANSITION",
    DAY_CALLOUTS: "DAY_CALLOUTS",
    DISCUSSION: "DISCUSSION",
    TRIAL: "TRIAL",
    EXECUTION: "EXECUTION",
    GAME_OVER: "GAME_OVER"
};

export const Role = {
    // Town idle
    VILLAGER: "VILLAGER",

    // Town protective
    HEALER: "HEALER",
    MASON: "MASON",

    // Town informative
    SEER: "SEER",
    SPY: "SPY",
    INVESTIGATOR: "INVESTIGATOR",

    // Town killing
    VETERAN: "VETERAN",
    PRIEST: "PRIEST",

    // Werewolves
    WEREWOLF: "WEREWOLF",
    WOLF_SEER: "WOLF_SEER",

    // Witches
    WITCH: "WITCH",
    DEATH_WITCH: "DEATH_WITCH",
    CREEPY_GIRL: "CREEPY_GIRL",

    // Arsonist
    ARSONIST: "ARSONIST",

    // Neutral roles
    JESTER: "JESTER",
    FOOL: "FOOL",

    // Pseudo-role just to represent the night order for passing the spooky doll around
    SPOOKY_DOLL: "SPOOKY_DOLL",
};

export const Alignment = {
    GOOD: "GOOD",
    EVIL: "EVIL",
    CHAOS: "CHAOS",
    NEUTRAL: "NEUTRAL"
};

export const Faction = {
    VILLAGE: "VILLAGE",
    WEREWOLVES: "WEREWOLVES",
    NEUTRAL: "NEUTRAL",
    WITCH: "WITCH",
    ARSONIST: "ARSONIST",
    FOOL: "FOOL"
};

export const Power = {
    NONE: 0,
    BASIC: 1,
    POWERFUL: 2,
    UNSTOPPABLE: 3
};

// NightPlayOrder is the order to wake players up
export const NightPlayOrder = [
    Role.JESTER,
    Role.VETERAN,
    Role.WITCH,
    Role.CREEPY_GIRL,
    Role.WEREWOLF,
    Role.HEALER,
    Role.SEER,
    Role.PRIEST,
    Role.MASON,
    Role.ARSONIST,
    Role.INVESTIGATOR,
    Role.SPY,
    Role.SPOOKY_DOLL, // For passing the spooky doll on and on...
];

// Night calculation order is the order in which the role functions should be executed
// First, we have roles that affect other people's actions (witch, veteran, etc)
// After that, we have trackable roles (roles that are active, such as werewolf, priest, healer...)
// Then, we have the investigatives (fortune teller [=seer], investigator and spy)
export const NightCalculationOrder = [
    Role.VETERAN,
    Role.WITCH,
    Role.JESTER,
    Role.CREEPY_GIRL,
    Role.WEREWOLF,
    Role.DEATH_WITCH,
    Role.ARSONIST,
    Role.PRIEST,
    Role.HEALER,
    Role.SEER,
    Role.WOLF_SEER,
    Role.INVESTIGATOR,
    Role.SPY
];

export const WolfSeerResults = dict(
    [Role.VILLAGER, "Your target is innocent and useless. They must be a villager!"],
    [Role.HEALER, "Your target heals people. They must be a healer!"],
    [Role.SEER, "Your target watches people's aura. They must ba a fortune teller!"],
    [Role.SPY, "Your target follows people at night. They must be a spy!"],
    [Role.INVESTIGATOR, "Your target has so much paperwork. They must be an investigator!"],
    [Role.VETERAN, "You found a gun at your target's house. They are a veteran!"],
    [Role.PRIEST, "Your target is worshiping God. They must be a priest!"],
    [Role.MASON, "Your target always seems to walk with another. They must be a mason!"],
    [Role.WEREWOLF, "That person works with you. They are a werewolf!"],
    [Role.WOLF_SEER, "It's like looking at a mirror. Your target is a wolf seer!"],
    [Role.WITCH, "Your target casts mystical spells. They must be a witch!"],
    [Role.ARSONIST, "Your target has fuel cans, they must be an arsonist!"],
    [Role.JESTER, "Your target just wants to be hung. They must be a jester!"],
    [Role.FOOL, "Your target just wants to be hung. They must be a fool!"],
    [Role.DEATH_WITCH, "Your target casts mystical spells. They must be a witch!"],
    [Role.CREEPY_GIRL, "Your target seems to hold a doll... She must be the creepy girl!"]
);