addEventListener('keydown', e => {
    if (e.key == "ArrowLeft") {
        document.querySelector('.page-left').classList.toggle('active');
    }

    if (e.key == "ArrowRight") {
        document.querySelector('.page-right').classList.toggle('active');
    }
});

var shipWidth = Math.min(innerWidth, innerHeight) / 15;

// querySelector no longer works since browser fingerprinting
// adds another canvas to the page onload
const canvas = document.querySelector('#gameboard');
const ctx = canvas.getContext('2d');

var state = null;
var ship = null;
var wallstate = null;
var timestamp = null;
var chatting = false;
var username = null

var socket = io();

const ships = [
    ship1,
    ship2,
    ship3
];

document.querySelector('#discord').style.display = 'block';

var discordModal = nanoModal(document.querySelector("#discord"), { buttons: [] });
discordModal.show();

discordModal.onHide(function() {
    document.querySelector('#how-to-play').style.display = 'block';
    nanoModal(document.querySelector("#how-to-play"), { buttons: [] }).show();
});


// ship handlers
function ship1(r) {
    if (r == "right") {
        var img = new Image();
        img.src = `images/ships/0;0.png`;
        return img;
    } else if (r == "left") {
        var img = new Image();
        img.src = `images/ships/0;180.png`;
        return img;
    } else if (r == "up") {
        var img = new Image();
        img.src = `images/ships/0;270.png`;
        return img;
    } else if (r == "down") {
        var img = new Image();
        img.src = `images/ships/0;90.png`;
        return img;
    }
}
function ship2(r) {
    if (r == "right") {
        var img = new Image();
        img.src = `images/ships/1;0.png`;
        return img;
    } else if (r == "left") {
        var img = new Image();
        img.src = `images/ships/1;180.png`;
        return img;
    } else if (r == "up") {
        var img = new Image();
        img.src = `images/ships/1;270.png`;
        return img;
    } else if (r == "down") {
        var img = new Image();
        img.src = `images/ships/1;90.png`;
        return img;
    }
}
function ship3(r) {
    if (r == "right") {
        var img = new Image();
        img.src = `images/ships/2;0.png`;
        return img;
    } else if (r == "left") {
        var img = new Image();
        img.src = `images/ships/2;180.png`;
        return img;
    } else if (r == "up") {
        var img = new Image();
        img.src = `images/ships/2;270.png`;
        return img;
    } else if (r == "down") {
        var img = new Image();
        img.src = `images/ships/2;90.png`;
        return img;
    }
}

// for sending keys to server
function keydown(e) {
    if (chatting) {
        // do nothing
    } else {
        socket.emit('keydown', e.key)
    }
}

function keyup(e) {
    if (e.key == "Enter") {
        if (chatting) {
            document.getElementById('chatinput').blur();
        } else {
            document.getElementById('chatinput').focus();
        }
    }
    if (chatting) {
        // do nothing
    } else {
        socket.emit('keyup', e.key)
    }
}

socket.on('join', data => {
    state = data.state;
    ship = data.ship;
    timestamp = data.time;

    // log players keys to not allow idleness
    const el = document.activeElement;
    const chatinput = document.getElementById('chatinput');

    chatinput.addEventListener('focusin', function() { chatting = true });
    chatinput.addEventListener('focusout', function() { chatting = false });

    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);

    // start listening for state updates now that game is started
    socket.on('state', data => {
        state = data.state;
        leaderboard = data.leaderboard;

        var top5 = []
        var top5_names = []
        var top5_ids = []
        var temp = null;

        // add all player scores to the leaderboard variable
        for (var player in leaderboard) {
            var name = state[player].username.substring(0, 10);
            var score = parseInt(state[player].score);

            top5.push(score)
            top5_names.push(name);
            top5_ids.push(state[player].perms);

        }

        // sort the leaderboard in descending order
        for (var i = 0; i < top5.length; i++) {
            for (var j = 0; j < i; j++) {
                if (top5[i] > top5[j]) {
                    var temp = top5[i]
                    var name_temp = top5_names[i]
                    var id_temp = top5_ids[i]

                    top5[i] = top5[j]
                    top5_names[i] = top5_names[j]
                    top5_names[i] = top5_ids[j];

                    top5[j] = temp
                    top5_names[j] = name_temp
                    top5_ids[j] = id_temp
                }
            }
        }

        var colors = []
        for (var i = 0; i < 5; i++) {
            document.getElementsByClassName("lb-player")[i].innerText = "";
            document.getElementsByClassName("lb-score")[i].innerText = "";
            document.getElementsByClassName("lb-player")[i].style.color = "auto";

            if (i < top5.length) {
                var username = top5_names[i]

                if (top5_ids[i] == 3) {
                    colors.push("purple");
                } else if (top5_ids[i] == 2) {
                    colors.push("green");
                } else if (top5_ids[i] == 1) {
                    colors.push("yellow");
                } else {
                    colors.push("auto");    
                }

                document.getElementsByClassName("lb-player")[i].innerText = username;
                document.getElementsByClassName("lb-score")[i].innerText = top5[i];

                document.getElementsByClassName("lb-player")[i].style.color = colors[i];

            } else {
                
            }
        }

        // update the players ship with each gameloop for easier
        // rendering.
        for (var player in state) {
            if (state[player].id == ship.id) {
                ship = state[player]
            }
        }

        update();
    });
});

function clamp() {
    if (ship.pos.x > 0) {
        // draw on left
        if (ship.pos.x >= 3000-(canvas.width/2)) {
            var width = (canvas.width/2) - (3000-ship.pos.x);
            var height = canvas.height;

            var x = 0;
            var y = 0;

            ctx.beginPath();

            ctx.globalCompositeOperation = "destination-over";

            ctx.fillStyle = "#000"
            ctx.rect(x, y, width, height);
            ctx.fill();

            ctx.closePath();
        } 
    } else {
        if (ship.pos.x <= -3000+(canvas.width/2)) {
            var width = (canvas.width/2) + (-3000-ship.pos.x);
            var height = canvas.height;

            var x = (canvas.width)-width;
            var y = 0;

            ctx.beginPath();

            ctx.globalCompositeOperation = "destination-over";

            ctx.fillStyle = "#000"
            ctx.rect(x, y, width, height);
            ctx.fill();

            ctx.closePath();
        }
    }

    if (ship.pos.y > 0) {
        // draw above
        if (ship.pos.y >= 3000-(canvas.height/2)) {
            var height = (canvas.height/2) - (3000-ship.pos.y);
            var width = canvas.width;

            var x = 0;
            var y = 0;

            ctx.beginPath();

            ctx.globalCompositeOperation = "destination-over";

            ctx.fillStyle = "#000"
            ctx.rect(x, y, width, height);
            ctx.fill();

            ctx.closePath();
        } 
    } else {
        if (ship.pos.y <= -3000+(canvas.height/2)) {
            var height = (canvas.height/2) + (-3000-ship.pos.y);
            var width = canvas.width;

            var x = 0;
            var y = canvas.height-height;

            ctx.beginPath();

            ctx.globalCompositeOperation = "destination-over";

            ctx.fillStyle = "#000"
            ctx.rect(x, y, width, height);
            ctx.fill();

            ctx.closePath();
        }
    }

    if (width != 0) {
        ctx.beginPath();

        ctx.globalCompositeOperation = "destination-over";

        ctx.fillStyle = "#000"
        ctx.rect(x, y, width, height);
        ctx.fill();

        ctx.closePath();
    }
}

/*
 * Function drawBoard - draws grid on canvas
 * takes 2 args, height, width of game canvas
*/
var drawBoard = function(w, h) {
    if (clamp()) return;

	ctx.beginPath();
    //clamp(ship.pos.x, ship.pos.y)
	
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
    ctx.strokeStyle = "gray";
    ctx.stroke();
    
    ctx.closePath();

};

/* 
 * function renderGame_Fields - prepares UI for playing
 * hides starting UI, tells server to start mainloop
 * takes 2 args: name, representing the player's given username
 * and the document location
*/
function renderGame_Fields(playerName) {
    if (playerName == "") {
        return
    }

    username = playerName;
    var ui = document.getElementById('ui');
    ui.style.display = "none";

    document.getElementById('leaderboard').style.display = "block";
    document.getElementById('death').style.display = "none";

    socket.emit('start', { username, fingerprint });
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

    return rotation
}

/*
 * function update - renders game elements on the client side
 * takes no args, relying on data sent by server in mainloop
*/
function update() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    if (!state || !ship) {
        return;
    }

    // ctx.translate();
    drawBoard(6000, 6000);

    ctx.translate((innerWidth - shipWidth) / 2, (innerHeight - shipWidth) / 2);

    ctx.save();

    // use rotated sprites instead of ctx.translate for
    // better performance

    var rotation = getRotation(ship.pos.r);

    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(ships[ship.ship](rotation), 0, 0, shipWidth, shipWidth);

    ctx.restore();

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = `${shipWidth / 6}px Arial`;
    ctx.fillText(ship.username, shipWidth / 2, 0, shipWidth * 2);

    state.forEach(enemy => {
        if (!enemy || enemy.id == ship.id) {
            // do nothing
        } else {
            rotation = getRotation(enemy.pos.r);

            ctx.drawImage(ships[enemy.ship](rotation), ship.pos.x - enemy.pos.x, ship.pos.y - enemy.pos.y, shipWidth, shipWidth);
            ctx.fillText(enemy.username, ship.pos.x - enemy.pos.x + shipWidth / 2, ship.pos.y - enemy.pos.y, shipWidth * 2);
        }
    });

    for (let player in state) {
        var old = {}

        for (var i = 0; i < state[player].walls.length; i++) {
            // change color of player's line
            if (state[player].id == socket.id) {
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
                    ctx.moveTo(ship.pos.x - state[player].walls[i][0] + shipWidth / 2, (ship.pos.y - state[player].walls[i][1]) + shipWidth / 2);
                    // make line continuous by not showing gap between gameState loops
                } else {
                    ctx.beginPath();
                    ctx.moveTo(old.x, old.y);
                }
            } else {
                ctx.lineTo(ship.pos.x - state[player].walls[i][0] + shipWidth / 2, (ship.pos.y - state[player].walls[i][1]) + shipWidth / 2, 10, 10);
                old.x = ship.pos.x - state[player].walls[i][0] + shipWidth / 2
                old.y = (ship.pos.y - state[player].walls[i][1]) + shipWidth / 2;
                ctx.closePath();
            }

            ctx.stroke();
            ctx.strokeStyle = "#000";
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

    var msgContainer = document.querySelector('.messages-container');

    var message = document.createElement('div');
    message.classList.add('message');

    var elAuthor = document.createElement('span');
    elAuthor.classList.add('author');
    elAuthor.innerText = author;

    var elContent = document.createElement('p');
    elContent.classList.add('message-content');
    elContent.innerText = data.msg;

    message.append(elAuthor);
    message.append(elContent);
    msgContainer.append(message);
    
});

socket.on('disconnect', function() {
    location.reload();
});

socket.on("death", score => {
    document.removeEventListener('keyup', keyup);
    document.removeEventListener('keydown', keydown);

    document.getElementById('leaderboard').style.display = "none";
    document.getElementById('death').style.display = "block";
    document.getElementById('dead_score').innerText = "Your Score: " + parseInt(score);
});

/* only active on tester server
socket.on("upgrades1", function() {
    document.querySelector('#upgrades1').style.display = 'block';
});

socket.on("upgrades2", () => {
    document.querySelector('#urgrades2').style.display = 'block';
});

socket.on("upgrades3", () => {
    document.querySelector('#urgrades3').style.display = 'block';
});
*/

function respawn() {
    renderGame_Fields(username);
}
