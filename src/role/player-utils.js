import { RoleGenerators } from "./role-generator";

export const createPlayer = (id, name, image, color, role) => {
    console.log(role);
    var player = new (RoleGenerators[role])(id, name, image, color);
    player.init();
    return player;
};

export const copyPlayer = (src, dst) => {
    dst.messages = src.messages;

    dst.dead = src.dead; // Fixing the creepy girl not dying bug (todo: consider not fixing it, reviving the creepy girl)
    dst.dead_sync = src.dead_sync;

    dst.doused = src.doused || false;
    dst.holds_doll = src.holds_doll || false;
};

export const convertPlayer = (player, role) => {
    console.log("Converting", player.name, "to", role);
    var n = createPlayer(player.id, player.name, player.image, player.color, role);
    console.log("New player object", n);
    copyPlayer(player, n);
    console.log("Modified player object", n);
    return n;
};