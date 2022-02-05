var movementSpeed = 5;

class Ship {
    constructor(id, fingerprint, isAi) {
        var d = new Date();

        this.id = id;
        this.fingerprint = fingerprint;

        this.username = "Unknown";
        this.ship = Math.round(Math.random() * 2);
        this.joinedAt = Date.now();
        this.score = 29850;
        this.isAi = isAi;
        this.isDead = false;
        this.scale = 1.15;

        // upgrade names
        this.upgrade1 = ""
        this.upgrade2 = "";
        this.upgrade3 = "";
        this.shieldActive = false;
        this.shieldStart = undefined;
        this.shieldEnd = d.getTime();

        var x = Math.floor(Math.random() * 3000);
        var y = Math.floor(Math.random() * 3000);
        var r = 0;
        
        this.pos = { x, y, r};
        this.end = { x, y };
        this.walls = []

        // upgrade checkers
        this.hasUp1 = false
        this.hasUp2 = false
        this.hasUp3 = false
        
        // time it takes for walls to fade
        this.duration = 2000

        this.perms = Ship.Perms.Player;
        this.keys = {};
    }

    static Perms = {
        Player: 0,
        Tester: 1,
        Admin: 2,
        Dev: 3
    }

    update() {
    	// too bad I  can't get one :p
    	var d = new Date();
    	
    	// wallx, wally, wall-time-left before fade, wall time of creation (ms)
    	this.walls.push([this.pos.x, this.pos.y, this.duration, d.getTime()]);
    	
    	for (var i=0; i<this.walls.length; i++) {
    		if (d.getTime()-this.walls[i][3] >= this.walls[i][2]) {
    			this.walls.splice(i, 1)
    		}
    	}
    
        this.pos.x += (this.end.x - this.pos.x) * 0.05;
        this.pos.y += (this.end.y - this.pos.y) * 0.05;

        var speed = movementSpeed;
        this.score += 0.2;

        if (this.perms >= Ship.Perms.Admin) {
            speed *= 1.5;
        }

        if (this.perms >= Ship.Perms.Dev) {
            speed *= 1.5;
        }
        if (this.upgrade1 == "speed"){
            speed *= 1.05;
        }

        var moved = false;
        if (this.keys.length > 0) {
        	moved = true;
        }
        
        if (this.keys["w"]) {
            this.end.y += speed;
            this.lastKey = "w";
            this.pos.r = 270
        }

        if (this.keys["s"]) {
            this.end.y -= speed;
            this.lastKey = "s";
            this.pos.r = 90
        }

        if (this.keys["a"]) {
            this.end.x += speed;
            this.lastKey = "a";
            this.pos.r = 180
        }

        if (this.keys["d"]) {
            this.end.x -= speed;
            this.lastKey = "d";
            this.pos.r = 0
        }

        if (!moved) {
            if (this.lastKey == "w") {
                this.end.y += speed;
            }
    
            if (this.lastKey == "s") {
                this.end.y -= speed;
            }
    
            if (this.lastKey == "a") {
                this.end.x += speed;
            }
    
            if (this.lastKey == "d") {
                this.end.x -= speed;
            }
        }

        this.end.x = Math.min(3000, Math.max(-3000, this.end.x));
        this.end.y = Math.min(3000, Math.max(-3000, this.end.y));
    }
}

class Game {

    /**
     * @param {Number} wpx Defines the width of the map 
     * @param {Number} hpx Defines the height of the map 
     */
    constructor(wpx, hpx) {
        this.players = {};
        this.size = [wpx, hpx];
        this.chat = [];
    }

    get playersArray() {
        return Object.entries(this.players).map(([key, value]) => value);
    }

    get leaderboard() {
        var players = Object.entries(this.players).map(([key, value]) => ({
            username: value.username,
            score: value.score,
            perms: value.perms
        }));

        return players.sort((a, b) => a.score < b.score ? -1 : (a. score > b.score ? 1 : 0));
    }

    /**
     * @param {Ship} ship 
     */
    addShip(ship) {
        this.players[ship.id] = ship;
    }

    findShip(username) {
        return Object.keys(this.players).find(key => this.players[key].username == username);
    }

    removeShip(id) {
        delete this.players[id];
        // console.log(this.players);
    }

}

class Message {
    /**
     * @param {String} content 
     * @param {Ship} author 
     */
    constructor(content, author) {
        this.content = content;
        this.author = author;
    }

    isCommand() {
        return this.content.startsWith('/');
    }
    
    tryExecute() {
        if (this.isCommand() && this.author.perms >= Ship.Perms.Admin) {
            var cmd = this.content.split(' ')[0];
            var args = this.content.split(cmd)[1].split(' ');
            commands[cmd](args);
            return true;
        }
        return false;
    }
}

var commands = {
    "/ban": {
        requiredPerms: Ship.Perms.Dev,
        minimumPers: Ship.Perms.Admin,
        
        run(data) {

        }
    },
    "/unban": {
        requiredPerms: Ship.Perms.Dev,
        minimumPers: Ship.Perms.Admin,
        
        run(data) {

        }
    },
    "/kick": {
        requiredPerms: Ship.Perms.Admin,
        minimumPers: Ship.Perms.Admin,
        
        run(data) {

        }
    },
    "/check": {
        requiredPerms: Ship.Perms.Admin,
        minimumPers: Ship.Perms.Admin,
        
        run(data) {

        }
    }
};

module.exports = { Game, Message, Ship };
