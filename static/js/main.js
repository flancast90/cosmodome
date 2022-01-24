var shipWidth = Math.min(innerWidth, innerHeight) / 15;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

var state = null;
var ship = null;

var socket = io();

const ships = [
    (() => {
        var img = new Image();
        img.src = `images/ships/0.svg`;
        return img;
    })(),
    (() => {
        var img = new Image();
        img.src = `images/ships/1.svg`;
        return img;
    })(),
    (() => {
        var img = new Image();
        img.src = `images/ships/2.svg`;
        return img;
    })(),
];

socket.on('join', data => {
   	state = data.state;
   	ship = data.ship;
   	
   	// start listening for state updates now that game is started
   	socket.on('state', data => {
   		state = data;
   		// alert(JSON.stringify(state));
   	
   		requestAnimationFrame(update);
	});
});

/*
 * Function drawBoard - draws grid on canvas
 * takes 3 args, height, width
*/
var drawBoard = function(w, h) {
    for (x = 0; x <= w; x += 50) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        for (y = 0; y <= h; y += 50) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
    }
    ctx.strokeStyle = "white";
    ctx.stroke();

};

/* 
 * function renderGame_Fields - prepares UI for playing
 * hides starting UI, tells server to start mainloop
 * takes 1 arg: name, representing the player's given username
*/	
function renderGame_Fields(name) {
	var ui = document.getElementById('ui');
	ui.style.display = "none";
	
	socket.emit('start', name);
}

/*
 * function update - renders game elements on the client side
 * takes no args, relying on data sent by server in mainloop
*/
function update() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    if (!state || !ship || ships[ship.ship].naturalWidth === 0) {
        return;
    }

	drawBoard(canvas.width, canvas.height);
    ctx.translate((innerWidth - shipWidth) / 2, (innerHeight - shipWidth) / 2);
    ctx.save();
    ctx.rotate(ship.pos.r);
    ctx.drawImage(ships[ship.ship], 0, 0, shipWidth, shipWidth);
    ctx.restore();

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = `${shipWidth / 6}px Arial`;
    ctx.fillText(ship.username, shipWidth / 2, 0, shipWidth * 2);

    state.forEach(x => {
        if (!x || x.id == ship.id) return;
        ctx.drawImage(ships[x.ship], ship.pos.x - x.pos.x, ship.pos.y - x.pos.y, shipWidth, shipWidth);
        ctx.fillText(x.username, ship.pos.x - x.pos.x + shipWidth / 2, ship.pos.y - x.pos.y, shipWidth * 2);
    });

    shipWidth = Math.max(innerWidth, innerHeight) / 15;
}

addEventListener('keydown', e => socket.emit('keydown', e.key));
addEventListener('keyup', e => socket.emit('keyup', e.key));
