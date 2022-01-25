const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var bodyParser = require('body-parser');
const io = new Server(server);
const basicAuth = require('express-basic-auth');
const exile = require('./backend/exile');

const { Ship } = require('./backend/models');
const { Log, LogLevel } = require('./backend/utils');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

game = {
    players: {}
};

const BUILDPATH = path.join(__dirname, "static");
app.use(express.static(BUILDPATH));

// set dev to true on developer page
// look for credentials onload
app.get('/dev', basicAuth({
    users: { dev: 'D3V3L0P3R' },
    challenge: true
}), (req, res) => {
		res.sendFile("index.html", {root: __dirname+"/static"});
});

io.on('connection', socket => {
  
    // uses exile-js library to determine if user is
    // banned or not
    app.post('/exile', function (req, res) {
      fingerprint = req.body.fingerprint;
      
    if (exile.check(fingerprint) == "banned") {
		res.status(403).send();
    }else{
		res.status(200).send();
    }
      
      Log(`${fingerprint} connected`, LogLevel.info);
    });

    socket.on('start', data => {
	var ship = new Ship(socket.id);
	game.players[socket.id] = ship;
    game.players[socket.id].username = data.name;
	game.players[socket.id].fingerprint = fingerprint;
	
	if (data.location.replace(/^.*[\\\/]/, '') == "dev") {
	  game.players[socket.id].isDev = true
	} else {
	  game.players[socket.id].isDev = false
	}
        
        const d = new Date();
        game.players[socket.id].time = d.getTime();
        
        socket.emit('join', { ship, state: Object.keys(game.players).map(key => game.players[key]) });
    });

    socket.on('keydown', key => {
      if (key == "w" || key == "a" || key == "s" || key == "d") {
      	game.players[socket.id].keys[key] = true;
      }
    });

    socket.on('keyup', key => {
      if (key == "w" || key == "a" || key == "s" || key == "d") {
      	game.players[socket.id].keys[key] = false;
      }
    });
    
    socket.on('chat', msg => {
      try {
      	var username = game.players[socket.id].username;
      } catch {
      	return
      }
    
      // add chat command support
      if (game.players[socket.id].isDev == true) {
	if (msg.includes('!ban ')) {
	  var person = msg.split('!ban ')[1]
	  var ban = exile.ban(person)
	  
	  io.sockets.emit('chat', {username: "SYSTEM", msg: ban});
	} else if (msg.includes('!unban ')) {
	  var person = msg.split('!unban ')[1]
	  var ban = exile.unban(person)
	  
	  io.sockets.emit('chat', {username: "SYSTEM", msg: ban});
	} else if (msg.includes('!check ')) {
	  var person = msg.split('!check ')[1]
	  var ban = exile.check(person);
	  var res = person+" ban status: "+ban;
	  
	  io.sockets.emit('chat', {username: "SYSTEM", msg: res});
	} else {
	  io.sockets.emit('chat', {username, msg});
	}
      } else {
	io.sockets.emit('chat', {username, msg});
      }
    });

    socket.on('disconnect', () => {
      try {
        Log(`${game.players[socket.id].fingerprint} disconnected`, LogLevel.info);
      } catch {
	Log(`${socket.id} disconnected.`);
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
      
      if (game.players[key].keys['w']) {
      	game.players[key].end.y = game.players[key].pos.y + 3;
      }
      if (game.players[key].keys['s']) {
      	game.players[key].end.y = game.players[key].pos.y - 3;
      }
      if (game.players[key].keys['a']) {
      	game.players[key].end.x = game.players[key].pos.x + 3;
      }
      if (game.players[key].keys['d']) {
      	game.players[key].end.x = game.players[key].pos.x - 3;
      }

      game.players[key].pos.x += (game.players[key].end.x - game.players[key].pos.x) * 0.2;
      game.players[key].pos.y += (game.players[key].end.y - game.players[key].pos.y) * 0.2;
      
      // time alive in seconds
      timeAlive = (parseInt(currentTime) - parseInt(game.players[key].time))/1000;	
      var username = game.players[key].username
	  
      leaderboard[username] = {score: (timeAlive*100)};
      leaderboard[username].id = key
	  
    };
  }

  for (var player in game.players) {
  	if (player != null) {
  		state.push(game.players[player])
  	}
  }

  io.sockets.emit('state', {leaderboard, state});
}, 20);


server.listen(8000, () => {
  console.log('🚀 Client Running on: http://localhost:8000');
});
