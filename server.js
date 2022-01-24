const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var bodyParser = require('body-parser');
const io = new Server(server);

const { Ship } = require('./backend/models');
const { Log, LogLevel } = require('./backend/utils');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var game = {
    players: {}
};

const BUILDPATH = path.join(__dirname, "static");
app.use(express.static(BUILDPATH));

app.get('/', (req, res) => {
  res.sendFile(__dirname + 'index.html');
});

io.on('connection', socket => {
    Log(`${socket.id} connected`, LogLevel.info);

    socket.on('start', username => {
        var ship = new Ship(socket.id);
        game.players[socket.id] = ship;
        game.players[socket.id].username = username;
        
        socket.emit('join', { ship, state: Object.keys(game.players).map(key => game.players[key]) });
    });

    socket.on('keydown', key => {
      game.players[socket.id].keys[key] = true;
    });

    socket.on('keyup', key => {
      game.players[socket.id].keys[key] = false;
    });

    socket.on('disconnect', () => {
        game.players[socket.id] = undefined;
        Log(`${socket.id} disconnected`, LogLevel.info);
    });
});

setInterval(() => {
  for (const key in game.players) {
    if (Object.hasOwnProperty.call(game.players, key) && game.players[key]) {
      
      if (game.players[key].keys['w']) game.players[key].end.y += 3;
      if (game.players[key].keys['s']) game.players[key].end.y -= 3;
      if (game.players[key].keys['a']) game.players[key].end.x += 3;
      if (game.players[key].keys['d']) game.players[key].end.x -= 3;

      game.players[key].pos.x += (game.players[key].end.x - game.players[key].pos.x) * 0.2;
      game.players[key].pos.y += (game.players[key].end.y - game.players[key].pos.y) * 0.2;
    };
  }

  io.sockets.emit('state', Object.keys(game.players).map(key => game.players[key]));
}, 20);

server.listen(8000, () => {
  console.log('🚀 Client Running on: http://localhost:8000');
});
