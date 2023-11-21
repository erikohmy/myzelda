class EntityInterval {
    game;
    constructor(game, interval, callback, initial=false) {
        this.game = game;
        this.interval = interval;
        this.callback = callback;
        this._tick = 0;
        this.count = 0;
        if (initial) {
            this.callback(this, this.count);
            this.count++;
        }
    }
    tick() {
        this._tick++;
        if (this._tick % this.interval == 0) {
            this.callback(this, this.count);
            this.count++;
        }
    }
}