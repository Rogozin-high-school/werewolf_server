import { Villager } from './good/villager';
import { Werewolf } from './evil/werewolf';
import { Healer } from './good/healer';
import { Seer } from './good/seer';
import { Witch } from './chaos/witch';
import { Jester } from './neutral/jester';
import { Priest } from './good/priest';
import { Veteran } from './good/veteran';
import { Spy } from './good/spy';
import { Investigator } from './good/investigator';
import { WolfSeer } from './evil/wolf-seer';
import { Arsonist } from './chaos/arsonist';
import { CreepyGirl } from './chaos/creepy-girl';
import { DeathWitch } from './chaos/death-witch';
import { Fool } from './neutral/fool';


export const RoleGenerators = dict(
    [Role.VILLAGER, Villager],
    [Role.WEREWOLF, Werewolf],
    [Role.HEALER, Healer],
    [Role.SEER, Seer],
    [Role.WITCH, Witch],
    [Role.JESTER, Jester],
    [Role.PRIEST, Priest],
    [Role.VETERAN, Veteran],
    [Role.SPY, Spy],
    [Role.INVESTIGATOR, Investigator],
    [Role.WOLF_SEER, WolfSeer],
    [Role.ARSONIST, Arsonist],
    [Role.CREEPY_GIRL, CreepyGirl],
    [Role.DEATH_WITCH, DeathWitch],
    [Role.FOOL, Fool]
)