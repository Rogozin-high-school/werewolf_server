import { GameRoom, Role } from "../Room";
import {testPlayer} from './tests-utils';


describe("healer role", () => {
    let room = new GameRoom(true);

    test('werwolf hit 1 healer heal 1', () => {

        let villager = testPlayer(Role.VILLAGER, "1");
        let healer = testPlayer(Role.HEALER, "2");
        let werewolf = testPlayer(Role.WEREWOLF, "3");

        room.players = [villager, healer, werewolf];
        room.NightPlayOrder = [Role.WEREWOLF, Role.HEALER];

        room.resetNight();

        werewolf.setTarget("1", room);
        healer.setTarget("1", room);

        room.endNight();

        
        expect(villager.dead).toBe(false)
        expect(villager.messages.indexOf("Someone attacked you but you were saved!")).not.toBe(-1);
    });

    test('werwolf hit 1 healer heal 2', () => {

        let villager = testPlayer(Role.VILLAGER, "1");
        let healer = testPlayer(Role.HEALER, "2");
        let werewolf = testPlayer(Role.WEREWOLF, "3");

        room.players = [villager, healer, werewolf];
        room.NightPlayOrder = [Role.WEREWOLF, Role.HEALER];

        room.resetNight();

        werewolf.setTarget("1", room);
        healer.setTarget("2", room);

        room.endNight();

        
        expect(villager.dead).toBe(true)
        expect(villager.messages.indexOf("Someone attacked you but you were saved!")).toBe(-1);
    });

    test('healer pass his turn', () => {

        let villager = testPlayer(Role.VILLAGER, "1");
        let healer = testPlayer(Role.HEALER, "2");
        let werewolf = testPlayer(Role.WEREWOLF, "3");

        room.players = [villager, healer, werewolf];
        room.NightPlayOrder = [Role.WEREWOLF, Role.HEALER];

        room.resetNight();

        werewolf.setTarget("1", room);
        healer.setTarget(false, room);

        room.endNight();

        
        expect(villager.dead).toBe(true)
        expect(villager.messages.indexOf("Someone attacked you but you were saved!")).toBe(-1);
    });
   })