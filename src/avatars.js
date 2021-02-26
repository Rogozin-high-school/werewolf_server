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
    let gender = genders[randInt(2)];
    let style = [ 'cm', 5 ];
    let traits = randTraits(getTraits(gender[0],style[0]));
    let outfit = randOutfit(getOutfits(randBrand(getBrands(gender[0]))));

    return buildPreviewUrl("head",1,gender[1],style[1],0,traits,outfit);
}
