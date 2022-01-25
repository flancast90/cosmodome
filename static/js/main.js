var shipWidth = Math.min(innerWidth, innerHeight) / 15;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

var state = null;
var ship = null;
var timestamp = null;

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
   	timestamp = data.time;
   	
   	// log players keys to not allow idleness
   	addEventListener('keydown', e => socket.emit('keydown', e.key));
	addEventListener('keyup', e => socket.emit('keyup', e.key));
	
	// show chat elements
	document.getElementById('chat').style.display = "block";
	document.getElementById('chatinput').style.display = "block";
   	
   	// start listening for state updates now that game is started
   	socket.on('state', data => {
   		state = data.state;
   		leaderboard = data.leaderboard;
   		var top5 = []
   		var top5_names = []
   		var temp = null;
   		
   		document.getElementById('leaderboard').innerText = "";
   		
   		// add all player scores to the leaderboard variable
   		for (var player in leaderboard) {
   			var name = player.substring(0, 10);
    		var score = parseInt(leaderboard[player].score);
    		
    		top5.push(score)
    		top5_names.push(name)
    		
    		if (leaderboard[player].id == ship.id) {
   				document.getElementById('score').innerHTML = "Score: "+score;
   			}
    	}
    	
    	// sort the leaderboard in descending order
    	for (var i=0; i<top5.length; i++) {
    		for (var j=0; j<i; j++) {
    			if (top5[i] > top5[j]) {
    				var temp = top5[i]
    				var name_temp = top5_names[i]
    				
    				top5[i] = top5[j]
    				top5_names[i] = top5_names[j]
    				
    				top5[j] = temp
    				top5_names[j] = name_temp
    			}
    		}
    	}
    	
    	document.getElementById('leaderboard').innerHTML = `<tr><th>Name:</th><th>Score:</th></tr>`;
		for (var i=0; i<5; i++) {
			if (i < top5.length) {
    			// too lazy for using createElement
    			document.getElementById('leaderboard').innerHTML += `<tr id="pair"></tr>`;
    			document.getElementById('pair').innerHTML = `<td id="tops"></td>`;
    			document.getElementById('tops').innerText = top5_names[i]
    			document.getElementById('tops').id = '';
    		
    			document.getElementById('pair').innerHTML += `<td id="tops"></td>`;
    			document.getElementById('tops').innerText = top5[i]
    			document.getElementById('tops').id = '';
    		
    			document.getElementById('pair').id = '';
    		
    		} else {
    			break;
    		}
		}
		
		// update the players ship with each gameloop for easier
		// rendering.
		for (var player in state) {
			if (state[player].id == ship.id) {
				ship = state[player]
			}
		}
   	
   		requestAnimationFrame(update);
	});
});

/*
 * Function drawBoard - draws grid on canvas
 * takes 2 args, height, width
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

	drawBoard(innerWidth, innerHeight);
    ctx.translate((innerWidth - shipWidth) / 2, (innerHeight - shipWidth) / 2);
    ctx.save();
    ctx.rotate(ship.pos.r);
    ctx.drawImage(ships[ship.ship], 0, 0, shipWidth, shipWidth);
    ctx.restore();

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = `${shipWidth / 6}px Arial`;
    ctx.fillText(ship.username, shipWidth / 2, 0, shipWidth * 2);

    state.forEach(enemy => {
        if (!enemy || enemy.id == ship.id) {
        	// do nothing
        }else {
        	ctx.drawImage(ships[enemy.ship], ship.pos.x - enemy.pos.x, ship.pos.y - enemy.pos.y, shipWidth, shipWidth);
        	ctx.fillText(enemy.username, ship.pos.x - enemy.pos.x + shipWidth / 2, ship.pos.y - enemy.pos.y, shipWidth * 2);
        }
    });

    shipWidth = Math.max(innerWidth, innerHeight) / 15;
}

document.getElementById('chatForm').addEventListener('submit', function(e) {
	socket.emit("chat", document.getElementById('chatinput').value);
	document.getElementById('chatinput').value = "";

	e.preventDefault();
});

socket.on("chat", data => {
	var author = data.username;
	var msg = data.msg;
	
	document.getElementById('chat').innerText += author+"> "+msg;
	document.getElementById('chat').innerHTML += "<br>";
});
