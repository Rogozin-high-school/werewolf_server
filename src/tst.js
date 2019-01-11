import { GameRoom, Role, createPlayer } from "./Room";

const testPlayer = (role, id) => createPlayer(id, id, id+".png", "blue", role);

const tests = {
    healer_basic: () => {

        var room = new GameRoom(true);

        var villager = testPlayer(Role.VILLAGER, "1");
        var healer = testPlayer(Role.HEALER, "2");
        var werewolf = testPlayer(Role.WEREWOLF, "3");

        room.players = [villager, healer, werewolf];
        room.NightPlayOrder = [Role.WEREWOLF, Role.HEALER];

        room.resetNight();

        werewolf.setTarget("1", room);
        healer.setTarget("1", room);

        room.endNight();

        if (!~villager.messages.indexOf("Someone attacked you but you were saved!")) {
            return "Villager did not get save message";
        }

        if (villager.dead) {
            return "Villager has died even though he was healed.";
        }

        return false;

    },

    healer_miss: () => {

        var room = new GameRoom(true);

        var villager = testPlayer(Role.VILLAGER, "1");
        var healer = testPlayer(Role.HEALER, "2");
        var werewolf = testPlayer(Role.WEREWOLF, "3");

        room.players = [villager, healer, werewolf];
        room.NightPlayOrder = [Role.WEREWOLF, Role.HEALER];

        room.resetNight();

        werewolf.setTarget("1", room);
        healer.setTarget("2", room);

        room.endNight();

        if (~villager.messages.indexOf("Someone attacked you but you were saved!")) {
            return "Villager got save message???";
        }

        if (!villager.dead) {
            return "Villager has not died even though he was attacked.";
        }

        return false;

    },

    healer_pass: () => {

        var room = new GameRoom(true);

        var villager = testPlayer(Role.VILLAGER, "1");
        var healer = testPlayer(Role.HEALER, "2");
        var werewolf = testPlayer(Role.WEREWOLF, "3");

        room.players = [villager, healer, werewolf];
        room.NightPlayOrder = [Role.WEREWOLF, Role.HEALER];

        room.resetNight();

        werewolf.setTarget("1", room);
        healer.setTarget(false, room);

        room.endNight();

        if (~villager.messages.indexOf("Someone attacked you but you were saved!")) {
            return "Villager got save message???";
        }

        if (!villager.dead) {
            return "Villager has not died even though he was attacked.";
        }

        return false;

    },

    werewolf: () => {

        var room = new GameRoom(true);

        var villager = testPlayer(Role.VILLAGER, "1");
        var werewolf = testPlayer(Role.WEREWOLF, "2");

        room.players = [villager, werewolf];
        room.NightPlayOrder = [Role.WEREWOLF];

        room.resetNight();

        werewolf.setTarget("1", room);

        room.endNight();

        if (!villager.dead) {
            return "Villager has not died even though he was attacked.";
        }

        return false;

    },

    werewolf_pass: () => {

        var room = new GameRoom(true);

        var villager = testPlayer(Role.VILLAGER, "1");
        var werewolf = testPlayer(Role.WEREWOLF, "2");

        room.players = [villager, werewolf];
        room.NightPlayOrder = [Role.WEREWOLF];

        room.resetNight();

        werewolf.setTarget(false, room);

        room.endNight();

        if (villager.dead) {
            return "Villager has died even though he was not attacked.";
        }

        return false;

    },

    all_any: () => {

        var room = new GameRoom(true);

        var seer = testPlayer(Role.SEER, "seer");
        var werewolf = testPlayer(Role.WEREWOLF, "werewolf");
        var healer = testPlayer(Role.HEALER, "healer");
        var veteran = testPlayer(Role.VETERAN, "veteran");
        var priest = testPlayer(Role.PRIEST, "priest");
        var investigator = testPlayer(Role.INVESTIGATOR, "investigator");
        var spy = testPlayer(Role.SPY, "spy");
        var witch = testPlayer(Role.WITCH, "witch");
        var jester = testPlayer(Role.JESTER);

        room.players = [seer, werewolf, healer, veteran, priest, investigator, spy, witch];
        room.NightPlayOrder = [Role.WITCH, Role.WEREWOLF, Role.SEER];

        room.resetNight();

        werewolf.setTarget(false, room);

        room.endNight();

        

    },
};

function runTests() {
    var res = {};
    for (var test_name in tests) if (tests.hasOwnProperty(test_name)) {
        res[test_name] = tests[test_name]();
    }
    console.log(res);
}

runTests();