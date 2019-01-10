import * as game from "./Room";

var room = new game.GameRoom(true);

console.log(Object.keys(game.Role).map(x => game.Role[x]))

var yotam = game.createPlayer("11111", "Yotam", "11111.png", "blue", game.Role.VILLAGER);
var nirit = game.createPlayer("22222", "Nirit", "22222.png", "blue", game.Role.CREEPY_GIRL);
var avi = game.createPlayer("33333", "Avi", "33333.png", "blue", game.Role.WEREWOLF);
// var noam = game.createPlayer("44444", "Noam", "44444.png", "blue", game.Role.VILLAGER);

room.players = [yotam, nirit, avi];
room.NightPlayOrder = [game.Role.WITCH, game.Role.CREEPY_GIRL, game.Role.WEREWOLF];
room.resetNight();

nirit.setTarget("11111", room);
avi.setTarget("33333", room);

room.endNight();

console.log(room.players);
console.log(room.getWinningFaction());
console.log(room.callouts);