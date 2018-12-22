const Role = {
    Villager: 0,
    Werewolf: 1,
    Healer: 2,
    Seer: 3
};

function Player(id, name, img, role) {
    this.id = id;
    this.name = name;
    this.img = img;

    this.dead = false;

    this.healers = [];
    this.target = null;
    
    this.reset = function() {
        this.healers.length = 0;
        this.target = null;
    }

    this.setTarget = function(target) {
        this.target = target;
    }
}

function Town() {
    
}