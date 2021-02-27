import { GameRoom } from "../Room";
import { Role } from "../game-enums";
import {testPlayer} from './tests-utils';

describe("witch role", () => {
    let room = new GameRoom(true);

    test('werwolf hit villager witch redirect it to werewolf', () => {

        let villager = testPlayer(Role.VILLAGER, "1");
        let werewolf = testPlayer(Role.WEREWOLF, "2");
        let witch = testPlayer(Role.WITCH, "3");

        room.players = [villager, werewolf, witch];
        room.NightPlayOrder = [Role.WITCH, Role.WEREWOLF];

        room.resetNight();

        witch.setTarget("2", room);
        witch.setTarget("2", room);
        werewolf.setTarget("1", room);

        room.endNight();

        expect(werewolf.dead).toBe(true);
        expect(villager.dead).toBe(false);
    });
});