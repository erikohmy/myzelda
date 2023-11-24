class EntityTransitionTarget extends EntityBase {
    constructor(game, x, y, d=2, name, onenter) {
        super(game);
        this.x = x;
        this.y = y;
        this.direction = d;
        this.targetName = name;
        this.onenter = onenter;
    }
}