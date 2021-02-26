import { createPlayer } from "../Room";

export const testPlayer = (role, id) => createPlayer(id, id, id+".png", "blue", role);