const express = require('express');
const app = express();
//to send it on "START" Line: 67 :)
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
        var ship = new Ship(socket.id, fingerprint);
        
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

setInterval(() => {
    // check to show upgrades or not
    for (let player in game.playersArray) {
        /*var playerScore = 0;
        var id = null;

        try {
            playerScore = game.playersArray[player].score;
            id = game.playersArray[player].id;
        }

        if ((playerScore >= 15000) && (game.playersArray[player].hasUp1 != true)) {
            io.to(id).emit("upgrades1")
            game.playersArray[player].hasUp1 = true;

        } else if ((playerScore >= 30000) && (game.playersArray[player].hasUp2 != true)) {
            io.to(id).emit("upgrades2")
            game.playersArray[player].hasUp2 = true;

        } else if ((playerScore >= 50000) && (game.playersArray[player].hasUp3 != true)) {
            io.to(id).emit("upgrades3")
            game.playersArray[player].hasUp3 = true;

        }*/

        // check if player is dead or not
        game.playersArray.forEach(user => {
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
    for (let player in game.playersArray) {
        gamePlayers++;
    }

    if ((gamePlayers < 5)&&(gamePlayers > 0)) {
        for (var i=0; i<gamePlayers; i++) {
            // make a few AI ships
            var usernames = [ "Michael", "Christopher", "Jessica", "Matthew", "Ashley", "Jennifer", "Joshua", "Amanda", "Daniel", "David", "James", "Robert", "John", "Joseph", "Andrew", "Ryan", "Brandon", "Jason", "Justin", "Sarah", "William", "Jonathan", "Stephanie", "Brian", "Nicole", "Nicholas", "Anthony", "Heather", "Eric", "Elizabeth", "Adam", "Megan", "Melissa", "Kevin", "Steven", "Thomas", "Timothy", "Christina", "Kyle", "Rachel", "Laura", "Lauren", "Amber", "Brittany", "Danielle", "Richard", "Kimberly", "Jeffrey", "Amy", "Crystal", "Michelle", "Tiffany", "Jeremy", "Benjamin", "Mark", "Emily", "Aaron", "Charles", "Rebecca", "Jacob", "Stephen", "Patrick", "Sean", "Erin", "Zachary", "Jamie", "Kelly", "Samantha", "Nathan", "Sara", "Dustin", "Paul", "Angela", "Tyler", "Scott", "Katherine", "Andrea", "Gregory", "Erica", "Mary", "Travis", "Lisa", "Kenneth", "Bryan", "Lindsey", "Kristen", "Jose", "Alexander", "Jesse", "Katie", "Lindsay", "Shannon", "Vanessa", "Courtney", "Christine", "Alicia", "Cody", "Allison", "Bradley", "Samuel", "Shawn", "April", "Derek", "Kathryn", "Kristin", "Chad", "Jenna", "Tara", "Maria", "Krystal", "Jared", "Anna", "Edward", "Julie", "Peter", "Holly", "Marcus", "Kristina", "Natalie", "Jordan", "Victoria", "Jacqueline", "Corey", "Keith", "Monica", "Juan", "Donald", "Cassandra", "Meghan", "Joel", "Shane", "Phillip", "Patricia", "Brett", "Ronald", "Catherine", "George", "Antonio", "Cynthia", "Stacy", "Kathleen", "Raymond", "Carlos", "Brandi", "Douglas", "Nathaniel", "Ian", "Craig", "Brandy", "Alex", "Valerie", "Veronica", "Cory", "Whitney", "Gary", "Derrick", "Philip", "Luis", "Diana", "Chelsea", "Leslie", "Caitlin", "Leah", "Natasha", "Erika", "Casey", "Latoya", "Erik", "Dana", "Victor", "Brent", "Dominique", "Frank", "Brittney", "Evan", "Gabriel", "Julia", "Candice", "Karen", "Melanie", "Adrian", "Stacey", "Margaret", "Sheena", "Wesley", "Vincent", "Alexandra", "Katrina", "Bethany", "Nichole", "Larry", "Jeffery", "Curtis", "Carrie", "Todd", "Blake", "Christian", "Randy", "Dennis", "Alison", "Trevor", "Seth", "Kara", "Joanna", "Rachael", "Luke", "Felicia", "Brooke", "Austin", "Candace", "Jasmine", "Jesus", "Alan", "Susan", "Sandra", "Tracy", "Kayla", "Nancy", "Tina", "Krystle", "Russell", "Jeremiah", "Carl", "Miguel", "Tony", "Alexis", "Gina", "Jillian", "Pamela", "Mitchell", "Hannah", "Renee", "Denise", "Molly", "Jerry", "Misty", "Mario", "Johnathan", "Jaclyn", "Brenda", "Terry", "Lacey", "Shaun", "Devin", "Heidi", "Troy", "Lucas", "Desiree", "Jorge" ]

            var ai_ship = new Ship("AI"+i, "");
        
            game.addShip(ai_ship);
            /*delete ai_ship;*/

            game.players["AI"+i].username = usernames[Math.floor(Math.random() * (usernames.length-1))];

            game.players["AI"+i].fingerprint = "";
            game.players["AI"+i].joinedAt = Date.now();

            /*io.sockets.emit('join', { ship: game.players["AI"+i], state: game.playersArray });*/
        }
    }
}, 20);


server.listen(8000, () => {
    console.log('🚀 Client Running on: http://localhost:8000');
});