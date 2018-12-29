import { Role, createPlayer } from "./Room";
console.log(Role.WEREWOLF);
var v = createPlayer("1", "1", "1", Role.VILLAGER);
var w = createPlayer("1", "1", "1", Role.WEREWOLF);

console.log(v);
console.log(w);
