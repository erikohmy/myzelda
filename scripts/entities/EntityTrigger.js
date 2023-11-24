class EntityTrigger {
    game;
    x; // position x
    y; // position y
    h; // height
    w; // width
    callback; // callback function
    subject;
    tempDisabled = false;
    
    constructor(game, x, y, w, h, callback, subject="player") {
        this.game = game;
        this.x = x;
        this.y = y;
        this.h = h;
        this.w = w;
        this.callback = callback;
        this.subject = subject;
    }

    logic() {
        if (this.subject === "player") {
            let player = this.game.world.player;
            if (player.x > this.x && player.x < this.x+this.w &&
                player.y > this.y && player.y < this.y+this.h) {
                if (!this.tempDisabled) {
                    this.callback(player, this);
                }
            } else {
                this.tempDisabled = false;
            }
        } else if (this.subject === "entity" || this.subject === "all"){
            let entities = this.game.world.currentSpace.entities;
            if (this.subject === "all") {
                entities = entities.concat(this.game.world.player);
            }
            entities.forEach(entity => {
                if (entity.hasOwnProperty("x") && entity.hasOwnProperty("y")) {
                    if (entity.x > this.x && entity.x < this.x+this.w && entity.y > this.y && entity.y < this.y+this.h) {
                        this.callback(entity, this);
                    }
                }
            });
        }
    }
}