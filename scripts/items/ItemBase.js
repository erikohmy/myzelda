class ItemBase { // inventory item that the player uses with action buttons
    game;

    name = "baseItem";
    description = "A base item";
    
    constructor(game) {
        this.game = game;
    }
    
    // todo: comment these out, so nothing runs if they arent defined
    actionPress() {} // called when action button is pressed
    actionRelease() {} // called when action button is released
    onEquip() {} // called when the item is equipped
    onUnequip() {} // called when the item is unequipped
    whileEquipped() {} // called every tick while the item is equipped
}