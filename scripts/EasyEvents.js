class EasyEvents {
    events = []
    constructor() {}
    on(event, callback, one = false) {
        this.events.push({event: event, callback: callback, one: one})
    }
    trigger(event, ...args) {
        let events = this.events.filter(e => e.event == event);
        events.forEach(e => {
            e.callback(...args);
            if (e.one) {
                this.events.splice(this.events.indexOf(e), 1);
            }
        })
    }
    remove(event) {
        this.events = this.events.filter(e => e.event != event);
    }
    clear() {
        this.events = [];
    }
}