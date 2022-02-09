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
var username = null;
var scaleFactor = 2;

var socket = io();

// cut on load times by requesting only one image on page load.
// we will then "cut" the correct ship images out of this image
// every time we need a new ship.
var spritesheet = new Image();

window.onload = function() {
    spritesheet.src= `images/ships.png`;
}

document.querySelector('#discord').style.display = 'block';

var discordModal = nanoModal(document.querySelector("#discord"), { buttons: [] });
discordModal.show();

discordModal.onHide(function() {
    document.querySelector('#how-to-play').style.display = 'block';
    nanoModal(document.querySelector("#how-to-play"), { buttons: [] }).show();
});


/*
 * function decideShip - decides which ship to draw for player
 * takes three arguments, ship num, ship rotation, and boolean shield
 */
function decideShip(num, r, shield) {
    var row = 1; 
    var column = (num*8)-8;
    var spriteWidth = 0;
    var spriteHeight = 0;
    var x = 0;

    // find the column based on the pattern
    // in the spritesheet.
    if (r==90) {column+=2}
    if (r==180) {column+=4}
    if (r==270) {column+=6}
    if (shield) {column+=1}

    // determine the width before this column to find 
    // clipping x and y
    for (var i=1; i<=column; i++) {
        if (i == column) {
            if (i%2 == 0){
                if ((i == 2) || (i == 6)){
                    spriteWidth=404; spriteHeight=404
                }else{
                    spriteWidth=362;
                    spriteHeight=362
                }
            } if (i%3 == 0) {
                spriteHeight=1280;
                if (num==0){
                    spriteWidth=896;
                } else if (num==1) {
                    spriteWidth=811;
                } else if (num==2) {
                    spriteWidth=597;
                }
            } else {
                spriteWidth=1280; 
                if (num==0){
                    spriteHeight=896;
                } else if (num==1) {
                    spriteHeight=811;
                } else if (num==2) {
                    spriteHeight=597;
                }
            }

            break;
        }

        if (i%2 == 0) {
            // shields are 362 px wide
            if ((i == 2) || (i == 6)) {
                // huey didn't use the EXACT images I sent
                // so now these widths are different
                x += 404;
            } else {
                x += 362;
            }
        } else if (i%3 == 0){
            if (num == 0) {
                x += 896;
            } else if (num == 1) {
                x += 811;
            } else if (num == 2) {
                x += 597;
            }
        } else {
            // sideways ships are 1280 px wide
            x += 1280
        }
    }

    /*var img = new Image();
    if (shield == true) {
        img.src = `images/ships/`+num+`;`+r+`-shield.png`;
    } else {
        img.src = `images/ships/`+num+`;`+r+`.png`;
    }
    return img;*/

    return [x, spriteWidth, spriteHeight]
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
            document.getElementsByClassName("lb-player")[i].style.color = "lightblue";

            if (i < top5.length) {
                var username = top5_names[i]

                if (top5_ids[i] == 3) {
                    colors.push("purple");
                } else if (top5_ids[i] == 2) {
                    colors.push("green");
                } else if (top5_ids[i] == 1) {
                    colors.push("yellow");
                } else {
                    colors.push("lightblue");    
                }

                document.getElementsByClassName("lb-player")[i].innerText = String(username).substring(0, 6);
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
                scaleFactor = ship.scale;
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

    if (ship.shieldActive != true) {
        ctx.translate((innerWidth - shipWidth) / 2, (innerHeight - shipWidth) / 2);
    } else {
        ctx.translate((innerWidth - shipWidth) / 2, (innerHeight - shipWidth) / 2);
    }

    ctx.scale(scaleFactor, scaleFactor);

    ctx.save();

    // use rotated sprites instead of ctx.translate for
    // better performance

    ctx.globalCompositeOperation = "source-over";

    if ((ship.shieldActive != true)&&(ship.invisibilityActive != true)) {
        var cut = decideShip(ship.ship, ship.pos.r, false)

        ctx.drawImage(spritesheet, cut[0], 0, cut[1], cut[2], 0, 0, shipWidth, shipWidth);
    } else if (ship.invisibilityActive != true) {
        shipWidth *= 1.5;
        // get spritesheet coords [before x, cropWidth, cropHeight]
        var cut = decideShip(ship.ship, ship.pos.r, true)

        ctx.drawImage(spritesheet, cut[0], 0, cut[1], cut[2], 0, 0, shipWidth, shipWidth);
    }

    ctx.restore();

    ctx.globalCompositeOperation = "source-over";

    if (ship.invisibilityActive != true) {
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = `${shipWidth / 6}px Arial`;
        ctx.fillText(ship.username, shipWidth / 2, 0, shipWidth * 2);
    }

    state.forEach(enemy => {
        if (!enemy || enemy.id == ship.id) {
            // do nothing
        } else if (enemy.invisibilityActive != true) {
            ctx.globalCompositeOperation = "source-over";

            ctx.drawImage(decideShip(ship.ship, ship.pos.r, false), ship.pos.x - enemy.pos.x, ship.pos.y - enemy.pos.y, shipWidth, shipWidth);

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

            ctx.lineWidth = 10;
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

    document.querySelector('#upgrades1').style.display = 'none';
    document.querySelector('#upgrades2').style.display = 'none';
    document.querySelector('#upgrades3').style.display = 'none';

    document.getElementById('leaderboard').style.display = "none";
    document.getElementById('death').style.display = "block";
    document.getElementById('dead_score').innerText = "Your Score: " + parseInt(score);
});

socket.on("upgrades1", function() {
    document.querySelector('#upgrades1').style.display = 'block';
});

socket.on("upgrades2", () => {
    document.querySelector('#upgrades2').style.display = 'block';
});

socket.on("upgrades3", () => {
    document.querySelector('#upgrades3').style.display = 'block';
});

function respawn() {
    renderGame_Fields(username);
}

document.addEventListener('click', function(e) {
    var upgrade = null;

    if (e.target.className == "upgrade respawn"){
        e.target.parentNode.style.display = "none";
        upgrade = e.target.innerText.toLowerCase().trim();

        socket.emit("upgrade", upgrade);
    } else if (e.target.parentNode.className == "upgrade respawn") {
        e.target.parentNode.parentNode.style.display = "none";

        upgrade = e.target.innerText.toLowerCase().trim();

        socket.emit("upgrade", upgrade);
    }

    if (upgrade == "+shield (temporary)") {
        document.querySelector('#shield').style.display = 'block';
    } else if (upgrade == "+teleport") {
        document.querySelector('#teleport').style.display = 'block';
    } else if (upgrade == "+invisibility (temporary)") {
        document.querySelector('#invisibility').style.display = 'block';
    }

    if (e.target.id == "shield") {
        socket.emit('shield');
        document.querySelector('#shield').style.display = 'none';

        setTimeout(function() {
            document.querySelector('#shield').style.display = 'block';
        }, 10000);
    } else if (e.target.id == "teleport") {
        socket.emit('teleport');
        document.querySelector('#teleport').style.display = 'none';

        setTimeout(function() {
            document.querySelector('#teleport').style.display = 'block';
        }, 10000);
    } else if (e.target.id == "invisibility") {
        socket.emit('invisibility');
        document.querySelector('#invisibility').style.display = 'none';

        setTimeout(function() {
            document.querySelector('#invisibility').style.display = 'block';
        }, 10000);
    }
});