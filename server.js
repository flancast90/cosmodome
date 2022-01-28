const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {
    Server
} = require("socket.io");
var bodyParser = require('body-parser');
const io = new Server(server);
const basicAuth = require('express-basic-auth');
const exile = require('./backend/exile');

const {
    Ship
} = require('./backend/models');
const {
    Log,
    LogLevel
} = require('./backend/utils');

try {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    game = {
        players: {}
    };

    var wallstate = {};

    const BUILDPATH = path.join(__dirname, "static");
    app.use(express.static(BUILDPATH));

    // set dev to true on developer page
    // look for credentials onload
    app.get('/dev', basicAuth({
        users: {
            dev: 'D3V3L0P3R'
        },
        challenge: true
    }), (req, res) => {
        res.sendFile("index.html", {
            root: __dirname + "/static"
        });
    });
    app.get('/admin', basicAuth({
        users: {
            admin: 'ADM1N'
        },
        challenge: true
    }), (req, res) => {
        res.sendFile("index.html", {
            root: __dirname + "/static"
        });
    });

    // uses exile-js library to determine if user is
    // banned or not
    app.post('/exile', function(req, res) {
        fingerprint = req.body.fingerprint;

        if (exile.check(fingerprint) == "banned") {
            res.status(403).send();
        } else {
            res.status(200).send();
        }

        Log(`${fingerprint} connected`, LogLevel.info);
    });

    function getScore(timeAlive) {
        var d = new Date();
        var currentTime = d.getTime()

        // player score increases /second
        var score = ((parseInt(currentTime) - parseInt(timeAlive)) / 1000) * 100;
        return score
    }

    io.on('connection', socket => {

            socket.on('start', data => {
                var ship = new Ship(socket.id);
                game.players[socket.id] = ship;
                game.players[socket.id].username = data.name;
                game.players[socket.id].fingerprint = fingerprint;

                if (socket.request.headers.referer.replace(/^.*[\\\/]/, '') == "dev") {
                    game.players[socket.id].isDev = true
                } else {
                    game.players[socket.id].isDev = false
                }


                if (socket.request.headers.referer.replace(/^.*[\\\/]/, '') == "admin") {
                    game.players[socket.id].isAdmin = true
                } else {
                    game.players[socket.id].isAdmin = false
                }

                const d = new Date();
                game.players[socket.id].time = d.getTime();

                socket.emit('join', {
                    ship,
                    state: Object.keys(game.players).map(key => game.players[key])
                });
            });

            try {
                socket.on('keydown', key => {
                    if (key == "w" || key == "a" || key == "s" || key == "d") {
                        // catch bug where players holding WSAD would crash server
                        try {
                            game.players[socket.id].keys[key] = true;
                        } catch (e) {
                            // pass
                        }
                    }
                });

                socket.on('keyup', key => {
                    if (key == "w" || key == "a" || key == "s" || key == "d") {
                        try {
                            game.players[socket.id].keys[key] = false;
                        } catch {
                            //pass
                        }
                    }
                });
            } catch {
                // do nothing
            }

            socket.on('chat', msg => {
                    try {
                        var username = game.players[socket.id].username;
                    } catch {
                        return
                    }

                    if (game.players[socket.id].isAdmin == true) {
                        if (msg.includes('!kick ')) {
                            var person = msg.split('!kick ')[1];
                            var found = null;

                            for (let player in game.players) {
                                if (game.players[player].username == person) {
                                    io.sockets.emit('chat', {
                                        username: "SYSTEM",
                                        msg: "kicked " + person
                                    });
                                    io.to(player).emit('kick');
                                    found = true;
                                    
                                    break;
                                }
                            }

                            if (!found) {
                                io.sockets.emit('chat', {
                                    username: "SYSTEM",
                                    msg: "couldn't find " + person
                                });
                            }

                        }
                    }

                    // add chat command support
                    if (game.players[socket.id].isDev == true) {

                        if (msg.includes('!kick ')) {
                            var person = msg.split('!kick ')[1];
                            var found = null;

                            for (let player in game.players) {
                                if (game.players[player].username == person) {
                                    io.sockets.emit('chat', {
                                        username: "SYSTEM",
                                        msg: "kicked " + person
                                    });
                                    io.to(player).emit('kick');
                                    found = true;

                                    break;
                                }
                            }

                            if (!found) {
                                io.sockets.emit('chat', {
                                    username: "SYSTEM",
                                    msg: "couldn't find " + person
                                });
                            }

                        }
                        if (msg.includes('!ban ')) {
                            var person = msg.split('!ban ')[1];
                            var found = null;

                            for (let player in game.players) {
                                if (game.players[player].username == person) {
                                	var id = game.players[player].fingerprint
                                	
                                    io.sockets.emit('chat', {
                                        username: "SYSTEM",
                                        msg: "banned " + person
                                    });
                                    var ban_msg = exile.ban(id);

                                    found = true;
                                    break;
                                }
                            }

                            if (!found) {
                                io.sockets.emit('chat', {
                                    username: "SYSTEM",
                                    msg: "couldn't find " + person
                                });
                            }
                        } else if (msg.includes('!unban ')) {
                            var person = msg.split('!unban ')[1];
                            var found = null;

                            for (let player in game.players) {
                                if (game.players[player].username == person) {
                                	var id = game.players[player].fingerprint
                                
                                    io.sockets.emit('chat', {
                                        username: "SYSTEM",
                                        msg: "unbanned " + person
                                    });
                                    var ban_msg = exile.unban(id);

                                    found = true;
                                    break;
                                }
                            }

                            if (!found) {
                                io.sockets.emit('chat', {
                                    username: "SYSTEM",
                                    msg: "couldn't find " + person
                                });
                            }
                        } else if (msg.includes('!check ')) {
                            var person = msg.split('!check ')[1];
                            var found = null;

                            for (let player in game.players) {
                                if (game.players[player].username == person) {
                                	var id = game.players[player].fingerprint
                                	
                                    var ban_msg = exile.check(id);
                                    
                                    io.sockets.emit('chat', {
                                        username: "SYSTEM",
                                        msg: "Ban status of "+person+": "+ban_msg
                                    });

                                    found = true;
                                    break;
                                }
                            }

                            if (!found) {
                                io.sockets.emit('chat', {
                                    username: "SYSTEM",
                                    msg: "couldn't find " + person
                                });
                            }
                        } else {
                            io.sockets.emit('chat', {
                                username,
                                msg
                            });
                        }
                    }
                });

                socket.on('disconnect', () => {
                    try {
                        Log(`${game.players[socket.id].fingerprint} disconnected`, LogLevel.info);
                    } catch {
                        Log(`${socket.id} disconnected.`);
                    }

                    // remove player's walls on disconnect
                    if (wallstate[socket.id]) {
                        delete wallstate[socket.id];
                    }
                    delete game.players[socket.id];
                });
        });
                
        setInterval(() => {
            const d = new Date();
            var currentTime = d.getTime();
            var leaderboard = {};
            var state = []

            for (const key in game.players) {
                if (Object.hasOwnProperty.call(game.players, key) && game.players[key]) {
                    var movementSpeed = 50;

                    // give devs insane speed
                    // admin will have double speed
                    if (game.players[key].isDev == true) {
                        movementSpeed = 200;
                    }
                    if (game.players[key].isAdmin == true) {
                        movementSpeed = 100;
                    }

                    // define map borders
                    if (((game.players[key].pos.x <= 0) && (game.players[key].keys['d'])) ||
                        ((game.players[key].pos.x >= 2000) && (game.players[key].keys['a'])) ||
                        ((game.players[key].pos.y >= 2000) && (game.players[key].keys['w'])) ||
                        ((game.players[key].pos.y <= 0) && (game.players[key].keys['s']))) {
                        //player is out of bounds
                    } else {
                        if (game.players[key].keys['w']) {
                            game.players[key].end.y = game.players[key].pos.y + movementSpeed;
                            game.players[key].pos.r = 270
                        }
                        if (game.players[key].keys['s']) {
                            game.players[key].end.y = game.players[key].pos.y - movementSpeed;
                            game.players[key].pos.r = 90
                        }
                        if (game.players[key].keys['a']) {
                            game.players[key].end.x = game.players[key].pos.x + movementSpeed;
                            game.players[key].pos.r = 180
                        }
                        if (game.players[key].keys['d']) {
                            game.players[key].end.x = game.players[key].pos.x - movementSpeed;
                            game.players[key].pos.r = 0
                        }

                        game.players[key].pos.x += (parseInt(game.players[key].end.x) - game.players[key].pos.x) * 0.2;
                        game.players[key].pos.y += (parseInt(game.players[key].end.y) - game.players[key].pos.y) * 0.2;
                    }

                    // time alive in seconds
                    var score = getScore(game.players[key].time);
                    var username = game.players[key].username

                    leaderboard[username] = {
                        score: score
                    };
                    leaderboard[username].id = key

                    if (!wallstate.hasOwnProperty(key)) {
                        wallstate[key] = {
                            coords: []
                        }
                    }

                    if (wallstate[key].coords) {
                        const d = new Date();
                        var length = wallstate[key].coords.length;

                        for (var i = 0; i < length; i++) {

                            try {
                                var score = wallstate[key].coords[i][3]
                                var duration = 3000;

                                if (score > 1000) {
                                    duration = 5000
                                } else if (score > 2000) {
                                    duration = 7000
                                } else if (score > 3000) {
                                    duration = 10000
                                } else if (score > 5000) {
                                    duration = 15000
                                } else if (score > 10000) {
                                    duration = 20000
                                } else if (score > 25000) {
                                    duration = 25000
                                } else if (score > 50000) {
                                    duration = 30000
                                } else if (score > 100000) {
                                    duration = 35000
                                } else if (score > 250000) {
                                    duration = 40000
                                } else if (score > 500000) {
                                    duration = 60000
                                }

                                if ((d.getTime() - wallstate[key].coords[i][2]) >= duration) {
                                    wallstate[key].coords.pop(i);
                                }

                            } catch (e) {
                                wallstate[key].coords.pop(i);
                            }
                        }

                        var coords = [game.players[key].pos.x, game.players[key].pos.y, d.getTime(), leaderboard[username].score]

                        wallstate[key].coords[length] = coords
                        wallstate[key].coords = wallstate[key].coords.filter(function(e) {
                            return e != null;
                        });
                    }

                };
            }

            for (var player in game.players) {
                if (player != null) {
                    state.push(game.players[player])
                }

                for (var placers in wallstate) {
                    var len = wallstate[placers].coords.length;
                    for (var j = 0; j < len; j++) {
                        // define hitboxes
                        try {
                            if ((game.players[player].pos.x - 45 < wallstate[placers].coords[j][0]) &&
                                (wallstate[placers].coords[j][0] < game.players[player].pos.x + 45)) {
                                if ((game.players[player].pos.y - 45 < wallstate[placers].coords[j][1]) &
                                    (wallstate[placers].coords[j][1] < game.players[player].pos.y + 45)) {
                                    if (placers != player) {
                                        var score = getScore(game.players[player].time);
                                        io.to(player).emit("death", score);

                                        game.players[placers].time = (game.players[placers].time - 100000)

                                        io.sockets.emit("chat", {
                                            username: "SYSTEM",
                                            msg: game.players[placers].username + " killed " + game.players[player].username
                                        });

                                        delete wallstate[player];
                                        delete game.players[player];
                                    }
                                }
                            }
                        } catch {

                        }
                    }
                }
            }

            io.sockets.emit('state', {
                leaderboard,
                wallstate,
                state
            });
        }, 50);


        server.listen(8000, () => {
            console.log('🚀 Client Running on: http://localhost:8000');
        });

    }
    catch (e) {
        console.log(e);
    }