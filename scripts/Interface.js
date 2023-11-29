class Interface {
	constructor(game) {
		this.game = game;
		this.events = new EasyEvents();
		this.heldKeys = [];
		this.heldPad = [];
		this.inputs = []; // the actual gameboy inputs: up, right, down, left, a, b, start, select
		this.inputsReleased = []; // inputs that were released this tick
		this.inputsPressed = []; // inputs that were pressed this tick
		this.gamepad = null;
		this.gamepadRaw = null;
		this.gamepadSetup = false;
		this.gamepadSetupCurrent = null;
		this.padCooldown = 0;
		this.enableRumble = false; // global rumble setting
		this.activeRumbles = [];

		this.controls = ["up","left","right","down","a","b","start","select"]
		
		this.keyboardControls = {
			"KeyW": "up",
			"KeyA": "left",
			"KeyD": "right",
			"KeyS": "down",
			"Space": "a",
			"KeyB": "b",
			"KeyE": "start",
			"KeyM": "select"
		};

		this.gamepadControls = {};
		this.knownGamepads = {
			"Xbox 360 Controller (XInput STANDARD GAMEPAD)": {
				"button:12": "up", // dpad up
				"button:14": "left", // dpad left
				"button:15": "right", // dpad right
				"button:13": "down", // dpad down
				"button:0": "a", // a
				"button:1": "b", // b
				"button:9": "start", // start
				"button:8": "select", // select

				"axis:0:n": "left", // left stick left/right
				"axis:0:p": "right", // right stick left/right
				"axis:1:n": "up", // left stick up/down
				"axis:1:p": "down", // right stick up/down
			}
		};
		this.gamepadHasRumble = false;

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

		// detect gamepad
		window.addEventListener("gamepadconnected", (e) => {
			console.log(
				"Gamepad connected at index %d: %s. %d buttons, %d axes.",
				e.gamepad.index,
				e.gamepad.id,
				e.gamepad.buttons.length,
				e.gamepad.axes.length,
			);
			if (!this.gamepad) {
				this.gamepad = e.gamepad;
			}
			this.pollGamepad();
		});
		window.addEventListener("gamepaddisconnected", (e) => {
			console.log(
				"Gamepad disconnected from index %d: %s",
				e.gamepad.index,
				e.gamepad.id,
			);
			if (this.gamepad && this.gamepad.index === e.gamepad.index) {
				this.gamepad = null;
			}
		});
	}

	setupGamepadRumble(doRumble = true) {
		if (this.enableRumble && this.gamepad?.vibrationActuator?.type === "dual-rumble") {
			this.gamepadHasRumble = true;
			if(!doRumble) {
				return;
			}
			this.rumble(100); // do a quick rumble to let the user know its a feature!
		} else {
			this.gamepadHasRumble = false;
		}
	}
	rumble(duration = 200, weakMagnitude = 1.0, strongMagnitude = 1.0) {
		if(this.gamepadHasRumble) {
			this.gamepad.vibrationActuator.playEffect("dual-rumble", {
				startDelay: 0,
				duration: duration,
				weakMagnitude: weakMagnitude,
				strongMagnitude: strongMagnitude,
			});
		}
	}
	rumbleRampup(max=1, tickstomax=120) {// creates a continuous rumble that ramps up, returns a function to stop it
		if(this.gamepadHasRumble) {
			let rampup = 0.05;
			let stepsize = max/tickstomax;
			let rampupInterval = setInterval(() => {
				rampup += stepsize;
				if(rampup > max) {
					rampup = max;
					//clearInterval(rampupInterval);
				}
				this.rumble(100, rampup, rampup);
			}, 1000/60);
			let fn = () => {
				clearInterval(rampupInterval);
				this.rumble(0, 0, 0);
				this.activeRumbles.splice(this.activeRumbles.indexOf(fn), 1);
			};
			this.activeRumbles.push(fn);
			return fn;
		}
		return null;
	}

	setupGamepad() {
		let buttons = this.gamepad.buttons;
		let axes = this.gamepad.axes;
		if (this.knownGamepads.hasOwnProperty(this.gamepad.id)) {
			console.log('You seem to use a', this.gamepad.id, this.gamepad)
			// setup from what we know!
			this.gamepadControls = this.knownGamepads[this.gamepad.id];
			this.setupGamepadRumble();
			this.gamepadSetup = true;
		} else {
			// make user set up their own controller
			if(this.padCooldown>0) {
				// wait for cooldown, to prevent setting all buttons to the same thing
				this.padCooldown--;
			}else if (this.gamepadSetupCurrent === null) {
				this.gamepadSetupCurrent = 0;
				let currentButton = this.controls[this.gamepadSetupCurrent];
				console.log("press button for", currentButton);
				this.padCooldown = 30; // 1/2 second
			} else { // waiting for input?
				let currentButton = this.controls[this.gamepadSetupCurrent];
				let pressed = [];
				buttons.filter((b) => b.pressed).forEach((b) => {
					// check if button is already set
					let btn = "button:"+buttons.indexOf(b);
					if(this.gamepadControls.hasOwnProperty(btn)) {
						return;
					}
					pressed.push(btn);
				});
				let sensitivity = 0.4;
				axes.forEach((a, i) => { // axes are -1 to 1, a is that value, i is index of axis, like axis:0 or axis:1
					let dir = a < -sensitivity ? "n" : a > sensitivity ? "p" : "c";
					let btn = "axis:"+i+":"+dir;
					if(dir === "c" || this.gamepadControls.hasOwnProperty(btn)) {
						return;
					}
					pressed.push(btn);
				});
				if (pressed.length) {
					// set the control
					this.gamepadControls[pressed[0]] = currentButton;
					console.log("set", currentButton, "to", pressed[0]);
					this.gamepadSetupCurrent++;
					if (this.gamepadSetupCurrent < this.controls.length) {
						currentButton = this.controls[this.gamepadSetupCurrent];
						console.log("press button for", currentButton);
					} else {
						console.log("done!");
						this.setupGamepadRumble();
						this.gamepadSetup = true;
						this.gamepadSetupCurrent = null;
					}
				}
			}
		}
	}

	// check things
	isKeyHeld(code) {
		return this.heldKeys.indexOf(code) !== -1;
	}
	pollGamepad() {
		if (this.gamepad) {
			for (const gamepad of navigator.getGamepads()) {
				if (gamepad?.index !== this.gamepad.index) {
					continue;
				}
				this.gamepad = gamepad;
				// check buttons
				let buttons = gamepad.buttons;
				let axes = gamepad.axes;
				this.gamepadRaw = {
					buttons: buttons,
					axes: axes
				};
				if(!this.gamepadSetup) {
					this.setupGamepad();
				} else {
					let c = this.gamepadControls;
					let btnsPressed = [];
					buttons.filter((b) => b.pressed).forEach((b) => {
						let btn = "button:"+buttons.indexOf(b);
						if(c.hasOwnProperty(btn)) {
							btnsPressed.push(c[btn]);
						}
					});
					let sensitivity = 0.4;
					axes.forEach((a, i) => { // axes are -1 to 1, a is that value, i is index of axis, like axis:0 or axis:1
						let dir = a < -sensitivity ? "n" : a > sensitivity ? "p" : "c";
						let btn = "axis:"+i+":"+dir;
						if(c.hasOwnProperty(btn)) {
							btnsPressed.push(c[btn]);
						}
					});
					// get all newly pressed buttons compared to heldpad
					let newPressed = btnsPressed.filter((b) => this.heldPad.indexOf(b) === -1);
					// get all newly released buttons compared to heldpad
					let newReleased = this.heldPad.filter((b) => btnsPressed.indexOf(b) === -1);
					// release all newly released buttons
					newReleased.forEach((b) => {
						this.releaseInput(b);
					});
					// press all newly pressed buttons
					newPressed.forEach((b) => {
						this.pressInput(b);
					});
					this.heldPad = btnsPressed;
					//console.log("newPressed", newPressed, "newReleased", newReleased);
				}
				
				setTimeout(() => {
					this.pollGamepad();
				}, 1000/60); // 60 times per second
				
				/*setTimeout(() => {
					this.pollGamepad();
				}, 1000); // once every second
				*/
			}
		}
	}
}