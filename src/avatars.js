import { randomOf } from "./util";
import { 
    genders, 
    randInt, 
    randTraits, 
    getTraits, 
    randOutfit, 
    getOutfits, 
    randBrand, 
    getBrands, 
    buildPreviewUrl
} from "libmoji";

/*
randomAvatar creates a URL for a random bitmoji avatar.
*/
export function randomAvatar() {
    
    const mandatory_traits = ["brow", "ear", "eye", "skin_tone", "pupil_tone"];

    let gender = genders[randInt(2)];
    let style = [ 'cm', 5 ];
    let traits = randTraits(getTraits(gender[0],style[0]));
    traits = traits.filter(t => (Math.random() < 0.3) || ~mandatory_traits.indexOf(t[0]));

    let outfit = randOutfit(getOutfits(randBrand(getBrands(gender[0]))));

    return buildPreviewUrl("head",1,gender[1],style[1],0,traits,outfit);
}

/*
randomName returns a random nickname
*/
export function randomName() {
    const firstNames = ["Aalis", "Bogdan", "Cateline", "Drago", "Elena", "Firmin", "Gomes", "Hawise", "Hann", "Isabel"];
    const lastNames = ["Ashdown", "Browne", "Clarke", "Cooper", "Fletcher", "Hughes", "Nash", "Payne", "Walter", "Wood"];

    return randomOf(firstNames) + " " + randomOf(lastNames);
}
