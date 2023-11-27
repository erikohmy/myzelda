class ItemShovel extends ItemBase {
    constructor(game) {
        super(game);
        this.name = "Shovel";
        this.description = "Shovel\nA handy tool.";
        this.digging = false;
        this.digFrame = 0;
    }
    playerBusy() {
        return this.digging;
    }
    actionPress() {
        if (this.digging) {
            return;
        }
        this.digging = true;
        this.digFrame = 0;
        this.game.everyTick(0, (t) => {
            this.digFrame = t;
            if (t>=25) {
                this.digging = false;
                this.game.interface.clearPressed();
                return false;
            }
        });
        let player = this.game.player;

        // actually dig 8px infront of the player, and if that isnt diggable, dig at feet
        let ox = 0;
        let oy = 0;
        let digoffset = 8;
        let tx = 0;
        let ty = 0;

        if(player.direction == 0) { oy = -(digoffset+player.feetOffset); }
        else if(player.direction == 1) { ox = digoffset; }
        else if(player.direction == 2) { oy = digoffset; }
        else if(player.direction == 3) { ox = -digoffset; }

        let beneath = player.space.tileAt(player.x+ox, player.y+player.feetOffset+oy);
        let tile = this.game.tile(beneath);
        tx = Math.floor((player.x+ox)/16);
        ty = Math.floor((player.y+player.feetOffset+oy)/16);

        if (!tile || !tile.dig) {
            beneath = player.tileBeneath();
            tile = this.game.tile(beneath);
            tx = Math.floor((player.x)/16);
            ty = Math.floor((player.y+player.feetOffset)/16);
        }
        if (tile && tile.dig) {
            this.game.sound.play('dig');
            let dug = tile.tileBeneath;
            console.log('dug tile', tx,ty)
            player.space.setTile(tx, ty, dug);
            // todo: get dropped item, and spawn it
            let drop = tile.digDropEntity(beneath);
            if (drop) {
                // todo: place at shovel tip, and make it fly out
                drop.x = player.x;
                drop.y = player.y;
            }
            // todo: spawn dig effect in player direction
        } else {
            this.game.sound.play('sword_tap');
        }
    }
    renderIcon(ctx, x, y) {
        let sheet = this.game.spritesheets.items;
        sheet.drawSprite(ctx, 8, 0, x, y, 1, 2);
    }
    animation() {
        if (this.digging) {
            let ox = this.game.offset[0];
            let oy = this.game.offset[1];

            let sheet = this.game.spritesheets.player;
            let player = this.game.player;
            let x = player.x;
            let y = player.y;
            let zo = 0; // y offset, for jumping/falling etc
            let wo = 8; // width offset
            let ho = 10; // height offset
            let sox = 0; // sprite offset x
            let soy = 0; // sprite offset y
            let nx = 0; // nudge x
            let ny = 0; // nudge y

            sox = 8+player.direction;
            soy = 2;
            if (this.digFrame > 10) {
                sox += 4;
            }
            sheet.drawSprite(this.game.ctx, sox, soy, x-wo+ox+nx, y-ho+oy+zo+ny);
            return true;
        }
    }
}