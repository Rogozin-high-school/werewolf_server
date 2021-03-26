import { createPlayer } from "../role/player-utils";

export const testPlayer = (role, id) => createPlayer(id, id, id+".png", "blue", role);
