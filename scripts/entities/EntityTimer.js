class EntityTimer {
    game;
    constructor(game, delay, callback, startSelf=false) {
        this.game = game;
        this.delay = delay;
        this.callback = callback;
        this._tick = 0;
        this.triggered = false;
        this.running = !!startSelf;
    }
    start() {
        this.running = true;
    }
    pause() {
        this.running = false;
    }
    reset() {
        this._tick = 0;
        this.triggered = false;
    }
    tick() {
        if (!this.running) return;
        this._tick++;
        if (!this.triggered && this._tick >= this.delay) {
            this.triggered = true;
            this.callback(this, this.count);
        }
    }
}