import { PhaseManager, LobbyPhase } from "./Phase";

var m = new PhaseManager(LobbyPhase);
console.log(m.current());