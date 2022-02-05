const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const basicAuth = require('express-basic-auth');
const exile = require('./backend/exile');

const { Game, Message, Ship } = require('./backend/models');
const { Log, LogLevel } = require('./backend/utils');

const bodyParser = require('body-parser');
const path = require('path');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

var game = new Game(3000, 3000);
var uptime = 0;

app.use(express.static(path.join(__dirname, "static")));

app.get('/dev', basicAuth({
    users: { dev: "D3V3L0P3R" },
    challenge: true
}), (req, res) => {
    res.sendFile("index.html", {
        root: __dirname + "/static"
    });
});

app.get('/admin', basicAuth({
    users: { admin: "ADM1N" },
    challenge: true
}), (req, res) => {
    res.sendFile("index.html", {
        root: __dirname + "/static"
    });
});

app.get('/tester', basicAuth({
    users: { tester: "goodgame" },
    challenge: true
}), (req, res) => {
    res.sendFile("index.html", {
        root: __dirname + "/static"
    });
});

var fingerprint = null;
io.on('connection', socket => {
    app.post('/exile', (req, res) => {
        if (exile.check(req.body.fingerprint)) {
            res.status(403).send();
        } else {
            res.status(200).send();
            fingerprint = req.body.fingerprint;
        }

        Log(`${req.body.fingerprint} connected`, LogLevel.info);
    });

    socket.on('start', data => {
        var ship = new Ship(socket.id, fingerprint, false);
        
        game.addShip(ship);
        delete ship;

        game.players[socket.id].username = data.username;
        game.players[socket.id].fingerprint = data.fingerprint;
        game.players[socket.id].joinedAt = Date.now();

        if (socket.request.headers.referer.replace(/^.*[\\\/]/, '') == 'tester') {
            game.players[socket.id].perms = Ship.Perms.Tester;
        }

        if (socket.request.headers.referer.replace(/^.*[\\\/]/, '') == 'admin') {
            game.players[socket.id].perms = Ship.Perms.Admin;
        }

        if (socket.request.headers.referer.replace(/^.*[\\\/]/, '') == 'dev') {
            game.players[socket.id].perms = Ship.Perms.Dev;
        }

        socket.emit('join', { ship: game.players[socket.id], state: game.playersArray });
    });

    socket.on('upgrade', name => {
        name = name.toLowerCase().trim();
        // console.log(name)

        if (name == "+trail length") {
            if (game.players[socket.id].upgrade1 == "") {
                game.players[socket.id].upgrade1 = "trail"

                game.players[socket.id].duration = 5000;
            }
        } else if (name == "+5% speed") {
            if (game.players[socket.id].upgrade1 == "") {
                game.players[socket.id].upgrade1 = "speed"
            }
        } else if (name == "+map zoom") {
            if (game.players[socket.id].upgrade2 == "") {
                game.players[socket.id].upgrade2 = "zoom"
                game.players[socket.id].scale = 1;
            }
        } else if (name == "+shield (temporary)") {
            if (game.players[socket.id].upgrade2 == "") {
                game.players[socket.id].upgrade2 = "shield";
            }
        }
    });

    socket.on('shield', () => {
        var d = new Date();

        if (game.players[socket.id].upgrade2 == "shield") {
            game.players[socket.id].shieldActive = true;
            game.players[socket.id].shieldStart = d.getTime();
        }
    });

    socket.on('chat', message => {
        if (!game.players[socket.id]) {
          socket.emit("chat", { username: "Server", msg: "!!! Please start the game to send a message !!!"});
          return;
        }

        var message = new Message(message, game.players[socket.id]);

        if (!message.tryExecute()) {
            io.sockets.emit("chat", { username: game.players[socket.id].username, msg: message.content })
        }
    });

    socket.on('disconnect', () => {
        game.removeShip(socket.id);
    });

    socket.on('keydown', function(key) {
        try {
            game.players[socket.id].keys[key] = true;
        } catch {
            // player may have disconnected or been killed
        }
    });

    socket.on('keyup', function(key) {
        try {
            game.players[socket.id].keys[key] = false
        } catch {
            // player may have disconnected or been killed
        }
    });
});

// control function for AI movement
function aiMovement(aiPlayer, direction) {
    var directions = ['w', 'a', 's', 'd']

    for (var i=0; i<directions.length; i++) {
        if (directions[i] != direction) {
            aiPlayer.keys[directions[i]] = false;
        } else {
            aiPlayer.keys[directions[i]] = true;
            aiPlayer.lastKey = directions[i];
        }
    }
}

// control function for AI run behaviour
function aiReverse(aiPlayer, enemyDir) {
    if (enemyDir['w']) {
        aiMovement(aiPlayer, 's')
    } else if (enemyDir['a']) {
        aiMovement(aiPlayer, 'd')
    } else if (enemyDir['s']) {
        aiMovement(aiPlayer, 'w')
    } else if (enemyDir['d']) {
        aiMovement(aiPlayer, 'a')
    }
}

setInterval(() => {
    // check to show upgrades or not
    for (let player in game.playersArray) {
        var playerScore = 0;
        var id = null;

        try {
            playerScore = game.playersArray[player].score;
            id = game.playersArray[player].id;

            if ((playerScore >= 15000) && (game.playersArray[player].hasUp1 != true)) {
                io.to(id).emit("upgrades1")
                game.playersArray[player].hasUp1 = true;

            } else if ((playerScore >= 30000) && (game.playersArray[player].hasUp2 != true)) {
                io.to(id).emit("upgrades2")
                game.playersArray[player].hasUp2 = true;

            } else if ((playerScore >= 50000) && (game.playersArray[player].hasUp3 != true)) {
                io.to(id).emit("upgrades3")
                game.playersArray[player].hasUp3 = true;

            }
        } catch {
            // pass
        }

        // check if player is dead or not
        game.playersArray.forEach(user => {
            if (user.upgrade2 == "shield") {
                if (user.shieldActive == true) {
                    var d = new Date();

                    if (user.shieldStart - d.getTime() >= 10000) {
                        user.shieldActive = false;
                        user.shieldEnd = d.getTime();
                    }
                }
            }

            user.walls.forEach(wall => {
                // console.log(wall);
                try {
                    if ((game.playersArray[player].pos.x - 45 < wall[0]) && (wall[0] < game.playersArray[player].pos.x + 45)) {
                        if ((game.playersArray[player].pos.y - 45 < wall[1]) && (wall[1] < game.playersArray[player].pos.y + 45)) {
                            if (user != game.playersArray[player]) {
                                try { 
                                    var score = game.playersArray[player].score;
                                    io.to(game.playersArray[player].id).emit("death", score);
                                } catch (e){
                                    console.log(e);
                                }

                                try {
                                    user.score += 1000;
                                } catch {
                                    
                                }

                                io.sockets.emit("chat", {
                                    username: "SYSTEM",
                                    msg: user.username + " killed " + game.playersArray[player].username
                                });
                                
                                //delete game.playersArray[player];
                                game.playersArray[player].isDead = true;

                                game.removeShip(game.playersArray[player].id);
                                //delete game.players[game.playersArray[player].id]
                                
                            }
                        }
                    }
                } catch(exception) {
                    //console.log(exception)
                }
            });
        });
    }

    game.playersArray.forEach(player => player.update());
    io.sockets.emit('state', {
        leaderboard: game.leaderboard,
        state: game.playersArray
    });
    
    var gamePlayers = 0;
    var aiPlayers = 0;

    for (let player in game.playersArray) {
        if (game.playersArray[player].isDead == false) {
            gamePlayers++;
        }

        if ((game.playersArray[player].isAi)&&(game.playersArray[player].isDead == false)) {
            aiPlayers++;
        }
    }

    if ((gamePlayers < 5)&&(gamePlayers > 0)&&(gamePlayers != aiPlayers)&&(uptime % 50 == 0)) {
        for (var i=0; i<6-gamePlayers; i++) {
            // make a few AI ships
            var keys = ['w', 'a', 's', 'd']
            var usernames = [ "Michael", "Christopher", "Jessica", "Matthew", "Ashley", "Jennifer", "Joshua", "Amanda", "Daniel", "David", "James", "Robert", "John", "Joseph", "Andrew", "Ryan", "Brandon", "Jason", "Justin", "Sarah", "William", "Jonathan", "Stephanie", "Brian", "Nicole", "Nicholas", "Anthony", "Heather", "Eric", "Elizabeth", "Adam", "Megan", "Melissa", "Kevin", "Steven", "Thomas", "Timothy", "Christina", "Kyle", "Rachel", "Laura", "Lauren", "Amber", "Brittany", "Danielle", "Richard", "Kimberly", "Jeffrey", "Amy", "Crystal", "Michelle", "Tiffany", "Jeremy", "Benjamin", "Mark", "Emily", "Aaron", "Charles", "Rebecca", "Jacob", "Stephen", "Patrick", "Sean", "Erin", "Zachary", "Jamie", "Kelly", "Samantha", "Nathan", "Sara", "Dustin", "Paul", "Angela", "Tyler", "Scott", "Katherine", "Andrea", "Gregory", "Erica", "Mary", "Travis", "Lisa", "Kenneth", "Bryan", "Lindsey", "Kristen", "Jose", "Alexander", "Jesse", "Katie", "Lindsay", "Shannon", "Vanessa", "Courtney", "Christine", "Alicia", "Cody", "Allison", "Bradley", "Samuel", "Shawn", "April", "Derek", "Kathryn", "Kristin", "Chad", "Jenna", "Tara", "Maria", "Krystal", "Jared", "Anna", "Edward", "Julie", "Peter", "Holly", "Marcus", "Kristina", "Natalie", "Jordan", "Victoria", "Jacqueline", "Corey", "Keith", "Monica", "Juan", "Donald", "Cassandra", "Meghan", "Joel", "Shane", "Phillip", "Patricia", "Brett", "Ronald", "Catherine", "George", "Antonio", "Cynthia", "Stacy", "Kathleen", "Raymond", "Carlos", "Brandi", "Douglas", "Nathaniel", "Ian", "Craig", "Brandy", "Alex", "Valerie", "Veronica", "Cory", "Whitney", "Gary", "Derrick", "Philip", "Luis", "Diana", "Chelsea", "Leslie", "Caitlin", "Leah", "Natasha", "Erika", "Casey", "Latoya", "Erik", "Dana", "Victor", "Brent", "Dominique", "Frank", "Brittney", "Evan", "Gabriel", "Julia", "Candice", "Karen", "Melanie", "Adrian", "Stacey", "Margaret", "Sheena", "Wesley", "Vincent", "Alexandra", "Katrina", "Bethany", "Nichole", "Larry", "Jeffery", "Curtis", "Carrie", "Todd", "Blake", "Christian", "Randy", "Dennis", "Alison", "Trevor", "Seth", "Kara", "Joanna", "Rachael", "Luke", "Felicia", "Brooke", "Austin", "Candace", "Jasmine", "Jesus", "Alan", "Susan", "Sandra", "Tracy", "Kayla", "Nancy", "Tina", "Krystle", "Russell", "Jeremiah", "Carl", "Miguel", "Tony", "Alexis", "Gina", "Jillian", "Pamela", "Mitchell", "Hannah", "Renee", "Denise", "Molly", "Jerry", "Misty", "Mario", "Johnathan", "Jaclyn", "Brenda", "Terry", "Lacey", "Shaun", "Devin", "Heidi", "Troy", "Lucas", "Desiree", "Jorge"];

            var ai_ship = new Ship("AI"+i, "", true);
        
            game.addShip(ai_ship);
            delete ai_ship;

            game.players["AI"+i].username = usernames[Math.floor(Math.random() * (usernames.length-1))];

            game.players["AI"+i].fingerprint = "";
            game.players["AI"+i].joinedAt = Date.now();

            aiMovement(game.players["AI"+i], keys[Math.floor(Math.random() * keys.length)]);

            uptime = uptime-50;
        }
    }

    for (let player in game.playersArray) {
        if (game.playersArray[player].isAi) {
            var thisPlayer = game.playersArray[player];

            if (thisPlayer.pos.x >= 2950) {
                // player is on left wall
                aiMovement(thisPlayer, 'd')

            } else if (thisPlayer.pos.x <= -2950) {
                // player is on right wall
                aiMovement(thisPlayer, 'a')
            }

            if (thisPlayer.pos.y >= 2950) {
                // player is on top wall
                aiMovement(thisPlayer, 's')

            } else if (thisPlayer.pos.y <= -2950) {
                // player is on bottom wall
                aiMovement(thisPlayer, 'w')
            }

            // by default run from players
            for (let enemy in game.playersArray) {
                if (game.playersArray[enemy] == thisPlayer) {
                    break;
                }

                var enemyPos = {
                    x: game.playersArray[enemy].pos.x,
                    y: game.playersArray[enemy].pos.y
                }

                if ((thisPlayer.pos.x - 300 < enemyPos.x) && (enemyPos.x < thisPlayer.pos.x + 300)) {
                    if ((thisPlayer.pos.y - 300 < enemyPos.y) && (enemyPos.y < thisPlayer.pos.y + 300)) {
                        aiReverse(thisPlayer, game.playersArray[enemy].keys);
                    }
                }
            }
        }
    }

    uptime++;
}, 20);


server.listen(8000, () => {
    console.log('🚀 Client Running on: http://localhost:8000');
});