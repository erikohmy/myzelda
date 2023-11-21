class EntityTick {
    game;
    constructor(game, callback) {
        this.game = game;
        this.callback = callback;
        this._tick = 0;
    }
    tick() {
        this.callback(this, this._tick);
        this._tick++;
    }
}