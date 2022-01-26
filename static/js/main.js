var shipWidth = Math.min(innerWidth, innerHeight) / 15;

// querySelector no longer works since browser fingerprinting
// adds another canvas to the page onload
const canvas = document.getElementById('gameboard');
const ctx = canvas.getContext('2d');

var state = null;
var ship = null;
var wallstate = null;
var timestamp = null;
var chatting = false;

var socket = io();

const ships = [
	ship1,
	ship2,
	ship3
];

// ship handlers
function ship1(r) {
	if (r == "right") {
    	var img = new Image();
    	img.src = `images/ships/0.svg`;
    	return img;
    } else if (r == "left") {
    	alert('fired');
    	var img = new Image();
    	img.src = `images/ships/0-left.svg`;
    	return img;
    } else if (r == "up") {
    	var img = new Image();
    	img.src = `images/ships/0-up.svg`;
    	return img;
    } else if (r == "down") {
    	var img = new Image();
    	img.src = `images/ships/0-down.svg`;
    	return img;
    }
}
function ship2(r) {
	if (r == "right") {
    	var img = new Image();
    	img.src = `images/ships/1.svg`;
    	return img;
    } else if (r == "left") {
    	var img = new Image();
    	img.src = `images/ships/1-left.svg`;
    	return img;
    } else if (r == "up") {
    	var img = new Image();
    	img.src = `images/ships/1-up.svg`;
    	return img;
    } else if (r == "down") {
    	var img = new Image();
    	img.src = `images/ships/1-down.svg`;
    	return img;
    }
}
function ship3(r) {
	if (r == "right") {
    	var img = new Image();
    	img.src = `images/ships/2.svg`;
    	return img;
    } else if (r == "left") {
    	var img = new Image();
    	img.src = `images/ships/2-left.svg`;
    	return img;
    } else if (r == "up") {
    	var img = new Image();
    	img.src = `images/ships/2-up.svg`;
    	return img;
    } else if (r == "down") {
    	var img = new Image();
    	img.src = `images/ships/2-down.svg`;
    	return img;
    }
}

socket.on('join', data => {
   	state = data.state;
   	ship = data.ship;
   	timestamp = data.time;
   	
   	// log players keys to not allow idleness
   	const el = document.activeElement;
   	const chatinput = document.getElementById('chatinput');
   	
   	chatinput.addEventListener('focusin', function() {chatting=true});
   	chatinput.addEventListener('focusout', function() {chatting=false});
   	
   	addEventListener('keydown', function(e) {
   		if (chatting) { 
   			// do nothing
   		} else {
   			socket.emit('keydown', e.key) 
   		}
   	});
	addEventListener('keyup', function(e) {
		if (chatting) {
			// do nothing
		} else {
			socket.emit('keyup', e.key)
		}
	});
	
	// show chat elements
	document.getElementById('chat').style.display = "block";
	document.getElementById('chatinput').style.display = "block";
   	
   	// start listening for state updates now that game is started
   	socket.on('state', data => {
   		state = data.state;
   		leaderboard = data.leaderboard;
   		wallstate = data.wallstate;
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
    	
    	var colors = []
		for (var i=0; i<5; i++) {
			if (i < top5.length) {
				var username = top5_names[i]
				var iter = 0
				
				for (let player in state) {
					if (username == state[player].username) {
						if (state[player].isDev) {
							colors.push("purple");
						} else if (state[player].isAdmin) {
							colors.push("green");
						} else {
							colors.push("auto");
						}
					}
				}
				
    			// too lazy for using createElement
    			document.getElementById('leaderboard').innerHTML += `<tr id="pair"></tr>`;
    			document.getElementById('pair').innerHTML = `<td id="tops" style="color:`+colors[i]+`"></td>`;
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
 * takes 2 args, height, width of game canvas
*/
var drawBoard = function(w, h) {
	ctx.beginPath();
	
    for (x = 0; x <= w; x += 50) {
        // draw vertical lines after pos.x
        ctx.moveTo(x+ship.pos.x, 0);
        ctx.lineTo(x+ship.pos.x, h);
        
        // draw vertical lines before pos.x
        ctx.moveTo(ship.pos.x-x, 0);
        ctx.lineTo(ship.pos.x-x, h);
        
        for (y = 0; y <= h; y += 50) {
            // draw horizontal lines after pos.y
            ctx.moveTo(0, y+ship.pos.y);
            ctx.lineTo(w, y+ship.pos.y);
            
            // draw horizontal lines before pos.y
            ctx.moveTo(0, ship.pos.y-y);
            ctx.lineTo(w, ship.pos.y-y);
        }
    }
    ctx.strokeStyle = "white";
    ctx.stroke();
    
    ctx.closePath();

};

/* 
 * function renderGame_Fields - prepares UI for playing
 * hides starting UI, tells server to start mainloop
 * takes 2 args: name, representing the player's given username
 * and the document location
*/	
function renderGame_Fields(name) {
	var ui = document.getElementById('ui');
	ui.style.display = "none";
	
	socket.emit('start', {name, location: window.location.href});
}

/*
 * function rotation - converts canvas data coords to directional strings
 * takes one arg: r, representing the data coord integer.
*/
function getRotation(r) {
	var rotation = null;
    if (r == 270) {
    		// up
    		rotation = "up"
    } else if (r == 90) {
    		// down
    		rotation = "down"
    } else if (r == 180) {
    		// left
    		rotation = "left"
    } else if (r == 0) {
    		// right
    		rotation = "right"
    }
    
    console.log(rotation);
    return rotation
}

/*
 * function update - renders game elements on the client side
 * takes no args, relying on data sent by server in mainloop
*/
function update() {
	var chat = document.getElementById("chat");
	chat.scrollTop = chat.scrollHeight;

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    if (!state || !ship) {
        return;
    }

	drawBoard(innerWidth, innerHeight);
    ctx.translate((innerWidth - shipWidth) / 2, (innerHeight - shipWidth) / 2);
    ctx.save();
    
    // use rotated sprites instead of ctx.translate for
    // better performance
    
    var rotation = getRotation(ship.pos.r);
    
    ctx.drawImage(ships[ship.ship](rotation), 0, 0, shipWidth, shipWidth);
    ctx.restore();

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = `${shipWidth / 6}px Arial`;
    ctx.fillText(ship.username, shipWidth / 2, 0, shipWidth * 2);

    state.forEach(enemy => {
        if (!enemy || enemy.id == ship.id) {
        	// do nothing
        }else {
        	rotation = getRotation(enemy.pos.r);
        	
        	ctx.drawImage(ships[enemy.ship](rotation), ship.pos.x - enemy.pos.x, ship.pos.y - enemy.pos.y, shipWidth, shipWidth);
        	ctx.fillText(enemy.username, ship.pos.x - enemy.pos.x + shipWidth / 2, ship.pos.y - enemy.pos.y, shipWidth * 2);
        }
    });
    
    for (let player in wallstate) {
    	var old = {}
    	
    	for (var i=0; i<wallstate[player].coords.length; i++) {
    		// change color of player's line
    		if (player == socket.id) {
    			ctx.strokeStyle = "rgba(0, 125, 255, 0.75)"
    		} else {
    			ctx.strokeStyle = "rgba(255, 151, 0, 0.75)"
    		}
    		
    		ctx.lineWidth = 15;
    		ctx.globalCompositeOperation = 'destination-over';
    	
    		// for a line, we need a beginning and end point.
    		// let the odd indexs be the beginning, and the even the endpoints.
    			
    		if (i % 2 == 0) {
    			if (i == 0) {
    				ctx.beginPath();
    				ctx.moveTo(ship.pos.x - wallstate[player].coords[i][0] + shipWidth / 2, (ship.pos.y - wallstate[player].coords[i][1])+shipWidth/2);
    			// make line continuous by not showing gap between gameState loops
    			} else {
    				ctx.beginPath();
    				ctx.moveTo(old.x, old.y);
    			}
    		} else {
    			ctx.lineTo(ship.pos.x - wallstate[player].coords[i][0] + shipWidth / 2, (ship.pos.y - wallstate[player].coords[i][1])+shipWidth/2, 10, 10);
    			old.x = ship.pos.x - wallstate[player].coords[i][0] + shipWidth / 2
    			old.y = (ship.pos.y - wallstate[player].coords[i][1])+shipWidth/2;
    			ctx.closePath();
    		}
    		
    		ctx.stroke();
    		ctx.strokeStyle ="#000";
    	}
    }

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
