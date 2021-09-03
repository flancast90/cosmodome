const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var bodyParser = require('body-parser');
const io = new Server(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const gameState = {
    players: {}
}

const BUILDPATH = path.join(__dirname);
app.use(express.static(BUILDPATH));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});

io.on('connection', (socket) => {
  socket.on('join', function (data) {
    console.log(data.uname+' ('+socket.id+') connected');
    
    gameState.players[socket.id] = {
        x: 40,
        y: 40,
        width:40,
        clientWidth: data.width,
        clientHeight: data.height,
        count: 0,
        storedCoords: {}
    }
    
    socket.on('movement', (playerMovement) => {
        const player = gameState.players[socket.id];

        var gameWidth = 10000;
        var gameHeight = 10000;
        if ((playerMovement.left)&&(player.x > 0)){
            player.x -= 2;
        }
        if ((playerMovement.right)&&(player.x < gameWidth)){
            player.x += 2;
        }
        if ((playerMovement.up)&&(player.y > 0)){
            player.y -= 2;
        }
        if ((playerMovement.down)&&(player.y < gameHeight)){
            player.y += 2;
        }
    });
    
    setInterval(() => {
        io.sockets.emit('state', gameState);
    }, 1000/60);

   socket.on('disconnect', () => {
        console.log(data.uname+' ('+socket.id+') disconnected');
        delete gameState.players[socket.id];
    });
  });

});

server.listen(8000, () => {
  console.log('🚀 Client Running on: http://localhost:8000');
});
