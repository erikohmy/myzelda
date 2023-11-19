class Interface {
	constructor(game, element) {
		this.game = game;
		this.element = element;
		this.event = new EasyEvents();
		this.offsets = {x:0,y:0}; // mouse offsets
		this.mouse = {x:0,y:0}; // mouse position
		this.heldKeys = [];
		
		this.controls = {
			"up": "KeyW",
			"left": "KeyA",
			"right": "KeyD",
			"down": "KeyS",
		};

		this.registerMouseEvents();
		this.registerKeyEvents();
		this.updateOffsets();

		this.event.on("mouse.move", this.updateMousePosition);
	}

	updateOffsets = () => {
		let bb = this.element.getBoundingClientRect();
		this.offsets.x = bb.x;
		this.offsets.y = bb.y;
	}

	updateMousePosition = (data) => {
		this.mouse.x = data.x;
		this.mouse.y = data.y;
	}

	registerMouseEvents = () => {
		this.element.onmousemove = ( event ) => {
			let scale = 5;
			let x = event.clientX - this.offsets.x;
			let y = event.clientY - this.offsets.y;
			this.event.trigger("mouse.move",{
				"x": Math.round( x / scale ),
				"y": Math.round( y / scale ),
				"event": event
			});
		}
	}

	registerKeyEvents = () => {
		document.addEventListener("keydown", (event) => {
			let code = event.code;
			if ( ! this.isKeyHeld(code) ) { // prevent event spamming
				this.heldKeys.push(code);
				this.event.trigger("key.down",{
					"code": code,
					"event": event
				});
			}
		});

		document.addEventListener("keyup", (event) => {
			let code = event.code;
			let index = this.heldKeys.indexOf(code);
			if ( index !== -1 ) { // if key exists
				this.heldKeys.splice(index, 1);
			}
			this.event.trigger("key.up",{
				"code": code,
				"event": event
			});
		});
	}

	// check things

	isKeyHeld = (code) => {
		return this.heldKeys.indexOf(code) !== -1;
	}

	control = (name) => {
		return this.controls[name];
	}

	isControlHeld = (name) => {
		let code = this.controls[name];
		return this.isKeyHeld(code);
	}
}