class EntityTransitioner extends EntityTrigger {
    constructor(game, x, y, w, h, target) {
        super(game, x, y, w, h, (e,t) => {
            game.world.goToString(target);
        });
    }
}