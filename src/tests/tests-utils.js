import { createPlayer } from "../role/player";

export const testPlayer = (role, id) => createPlayer(id, id, id+".png", "blue", role);