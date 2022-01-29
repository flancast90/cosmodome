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

app.use(express.static(path.join(__dirname, "static")));

app.get('/dev', basicAuth({
	users: { dev: "D3V3L0P3R"},
	challenge: true
}), (req, res) => {
	res.sendFile("index.html", {
		root: __dirname + "/static"
	});
});

app.get('/admin', basicAuth({
	users: { admin: "ADM1N"},
	challenge: true
}), (req, res) => {
	res.sendFile("index.html", {
		root: __dirname + "/static"
	});
});

app.get('/tester', basicAuth({
	users: { tester: "goodgame"},
	challenge: true
}), (req, res) => {
	res.sendFile("index.html", {
		root: __dirname + "/static"
	});
});

app.post('/exile', (req, res) => {
	if (exile.check(req.body.fingerprint)) {
		res.status(403).send();
	} else {
		res.status(200).send();
	}
	
	Log(`${req.body.fingerprint} connected`, LogLevel.info);
});

io.on('connection', socket => {
	var ship = new Ship(socket.id);

	socket.on('start', data => {
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
		var message = new Message(message, game.players[socket.id]);
		
		if (!message.tryExecute()) {
			io.sockets.emit("chat", {username:game.players[socket.id].username, msg:message.content})
		}
	});

	socket.on('disconnect', () => {
		game.removeShip(socket.id);
	});

	socket.on('keydown', key => game.players[socket.id].keys[key] = true);
	socket.on('keyup', key => game.players[socket.id].keys[key] = false);
});

setInterval(() => {
    // check to show upgrades or not
    for (let player in game.playersArray) {
        var playerScore = game.playersArray[player].score;
        var id = game.playersArray[player].id;

        if ((playerScore >= 15000)&&(game.playersArray[player].hasUp1 != true)) {
            io.to(id).emit("upgrades1")
            game.playersArray[player].hasUp1 = true;

        } else if ((playerScore >= 30000)&&(game.playersArray[player].hasUp2 != true)) {
            io.to(id).emit("upgrades2")
            game.playersArray[player].hasUp2 = true;

        } else if ((playerScore >= 50000)&&(game.playersArray[player].hasUp3 != true)) {
            io.to(id).emit("upgrades3")
            game.playersArray[player].hasUp3 = true;

        }
    }

	game.playersArray.forEach(player => player.update());
	io.sockets.emit('state', {
		leaderboard: game.leaderboard,
		state: game.playersArray
	});
}, 20);


server.listen(8000, () => {
  console.log('🚀 Client Running on: http://localhost:8000');
});