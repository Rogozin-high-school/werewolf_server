import { createPlayer } from "../room";

export const testPlayer = (role, id) => createPlayer(id, id, id+".png", "blue", role);