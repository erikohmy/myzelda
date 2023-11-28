class Interface {
	constructor(game) {
		this.game = game;
		this.events = new EasyEvents();
		this.heldKeys = [];
		this.inputs = []; // the actual gameboy inputs: up, right, down, left, a, b, start, select
		this.inputsReleased = []; // inputs that were released this tick
		this.inputsPressed = []; // inputs that were pressed this tick
		
		this.keyboardControls = {
			"KeyW": "up",
			"KeyA": "left",
			"KeyD": "right",
			"KeyS": "down",
			"Space": "a",
			"KeyB": "b",
			"KeyP": "start",
			"KeyM": "select"
		};

		this.gamepadControls = {}; // todo

		this.registerKeyEvents();

		this.events.on('key.down', (code, event) => {
			let input = this.keyboardControls[code];
			if (input && this.inputs.indexOf(input) === -1) {
				this.pressInput(input);
			}
		});

		this.events.on('key.up', (code, event) => {
			let input = this.keyboardControls[code];
			if (input && this.inputs.indexOf(input) !== -1) {
				this.releaseInput(input);
			}
		});

		this.events.on('blur', () => {
			// add class to application
			document.querySelector('.application').classList.add('blur');
		});
		this.events.on('focus', () => {
			// remove class to application
			document.querySelector('.application').classList.remove('blur');
		});

		/* todo: redo these
		game.events.trigger('pressed', control);
		game.events.trigger('control-'+control);
		*/
	}

	pressInput(name) { // adds an input to the list of inputs, and triggers events
		if (this.inputs.indexOf(name) === -1) {
			if (name === "up") {
				this.releaseInput("down");
			} else if (name === "down") {
				this.releaseInput("up");
			} else if (name === "left") {
				this.releaseInput("right");
			} else if (name === "right") {
				this.releaseInput("left");
			}
			this.inputs.push(name);
			this.game.events.trigger('input', name);
			this.game.events.trigger('input.'+name);
			if (this.inputsPressed.indexOf(name) === -1) {
				this.inputsPressed.push(name);
			}
		}
	}

	releaseInput(name) { // removes an input from the list of inputs, and triggers events
		let index = this.inputs.indexOf(name);
		if (index !== -1) {
			this.inputs.splice(index, 1);
			this.game.events.trigger('input.released', name);
			this.game.events.trigger('input.'+name+'.released');
			if (this.inputsReleased.indexOf(name) === -1) {
				this.inputsReleased.push(name);
			}
		}
	}
	releaseAllInputs() {
		this.inputs.forEach((input) => {
			this.releaseInput(input);
		});
	}
	clearPressed() {
		this.inputsPressed = [];
	}
	tick() {
		this.inputsPressed = [];
		this.inputsReleased = [];
	}
	get up() {return this.inputs.indexOf("up") !== -1;}
	get down() {return this.inputs.indexOf("down") !== -1;}
	get left() {return this.inputs.indexOf("left") !== -1;}
	get right() {return this.inputs.indexOf("right") !== -1;}
	get a() {return this.inputs.indexOf("a") !== -1;}
	get b() {return this.inputs.indexOf("b") !== -1;}
	get start() {return this.inputs.indexOf("start") !== -1;}
	get select() {return this.inputs.indexOf("select") !== -1;}

	get dpad() {
		// get the dpad main direction (first held direction in inputs)
		let held = this.inputs.filter((i) => ["up", "down", "left", "right"].indexOf(i) !== -1);
		return held[0] || null;
	}

	registerKeyEvents = () => {
		document.addEventListener("keydown", (event) => {
			let code = event.code;
			if ( ! this.isKeyHeld(code) ) { // prevent event spamming
				this.heldKeys.push(code);
				this.events.trigger("key.down", code, event);
			}
		});

		document.addEventListener("keyup", (event) => {
			let code = event.code;
			let index = this.heldKeys.indexOf(code);
			if ( index !== -1 ) { // if key exists
				this.heldKeys.splice(index, 1);
			}
			this.events.trigger("key.up", code, event);
		});

		// detect document losing focus
		window.addEventListener("blur", () => {
			this.releaseAllInputs();
			this.events.trigger("blur");
		});
		window.addEventListener("focus", () => {
			this.events.trigger("focus");
		});
	}

	// check things
	isKeyHeld = (code) => {
		return this.heldKeys.indexOf(code) !== -1;
	}
}