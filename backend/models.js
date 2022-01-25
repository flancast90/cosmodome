class Ship {
    constructor(id) {
        this.id = id;
        this.username = "Unknown";
        this.ship = Math.round(Math.random() * 2);
        
        var x = Math.floor(Math.random() * 500), 
            y = Math.floor(Math.random() * 500);

        this.pos = { x, y, r: 0 };
        this.end = { x, y };

        this.keys = {};
    }
}

module.exports = { Ship };
