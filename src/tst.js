import * as game from "./Room";

var room = new game.GameRoom(true);

console.log(Object.keys(game.Role).map(x => game.Role[x]))

var yotam = game.createPlayer("11111", "Yotam", "11111.png", "blue", game.Role.WITCH);
// var nirit = game.createPlayer("22222", "Nirit", "22222.png", "blue", game.Role.WOLF_SEER);
// var avi = game.createPlayer("33333", "Avi", "33333.png", "blue", game.Role.HEALER);
// var noam = game.createPlayer("44444", "Noam", "44444.png", "blue", game.Role.VILLAGER);

room.players = [yotam];
room.NightPlayOrder = [game.Role.WITCH];
room.resetNight();

yotam.setTarget("11111", room);
yotam.setTarget("11111", room);

room.calculateNightActions();
room.calculateWerewolfKill();
room.calculateNightDeaths();
room.calculatePromotions();
room.calculateConversions();
room.broadcaseNightMessages();

console.log(room.players);
console.log(room.getWinningFaction());
