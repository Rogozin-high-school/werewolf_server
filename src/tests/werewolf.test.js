import { GameRoom, Role } from "../room";
import {testPlayer} from './tests-utils';

describe("werewolf role", () => {
    let room = new GameRoom(true);

    test('werwolf hit villager', () => {

        let villager = testPlayer(Role.VILLAGER, "1");
        let werewolf = testPlayer(Role.WEREWOLF, "2");

        room.players = [villager, werewolf];
        room.nightPlayOrder = [Role.WEREWOLF];

        room.resetNight();

        werewolf.setTarget("1", room);

        room.endNight();

        
        expect(villager.dead).toBe(true)
    });

    test('werewolf pass his turn', () => {

        let villager = testPlayer(Role.VILLAGER, "1");
        let werewolf = testPlayer(Role.WEREWOLF, "2");

        room.players = [villager, werewolf];
        room.nightPlayOrder = [Role.WEREWOLF];

        room.resetNight();

        werewolf.setTarget(false, room);

        room.endNight();

        expect(villager.dead).toBe(false)
    });
   })