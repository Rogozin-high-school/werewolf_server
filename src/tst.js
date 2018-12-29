import * as game from "./Room";

var room = new game.GameRoom();

var yotam = game.createPlayer("11111", "Yotam", "11111.png", game.Role.WEREWOLF);
var nirit = game.createPlayer("22222", "Nirit", "22222.png", game.Role.VILLAGER);
var avi = game.createPlayer("33333", "Avi", "33333.png", game.Role.HEALER);
var noam = game.createPlayer("44444", "Noam", "44444.png", game.Role.VILLAGER);

room.players = [yotam, nirit, avi, noam];

avi.setTarget("22222", room);

room.calculateWerewolfKill();
room.calculateNightActions();
room.calculateNightDeaths();

console.log(room);