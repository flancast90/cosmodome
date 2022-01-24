var shipWidth = Math.min(innerWidth, innerHeight) / 15;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

var state = null;
var ship = null;
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


var socket = io();

socket.on('join', data => {
    state = data.state;
    ship = data.ship;
});

socket.on('state', data => {
    state = data;
});

requestAnimationFrame(function update() {
    requestAnimationFrame(update);

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    if (!state || !ship || ships[ship.ship].naturalWidth === 0) {
        return;
    }

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
        console.log(x.pos);
        ctx.drawImage(ships[x.ship], ship.pos.x - x.pos.x, ship.pos.y - x.pos.y, shipWidth, shipWidth);
        ctx.fillText(x.username, ship.pos.x - x.pos.x + shipWidth / 2, ship.pos.y - x.pos.y, shipWidth * 2);
    });

    shipWidth = Math.max(innerWidth, innerHeight) / 15;
});

addEventListener('keydown', e => socket.emit('keydown', e.key));
addEventListener('keyup', e => socket.emit('keyup', e.key));
