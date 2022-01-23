const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');




class Ship {
    constructor(x, y, r) {
        this.username = "Unknown";
        this.img = new Image();
        this.img.src = `images/ships/${Math.round(Math.random() * 2)}.svg`;

        
        this.pos = { x, y, r };
        this.end = { x, y };

        this.animation = { speed: 0.1 };

        this.positions = [];
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    Draw(ctx) {
        if (this.img.naturalWidth === 0) {
            return;
        }

        ctx.save();
        ctx.translate(this.pos.x + 25, this.pos.y + 25);
        ctx.rotate(this.pos.r);
        ctx.drawImage(this.img, -25, -25, 50, 50);
        ctx.restore();
        
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.moveTo(this.pos.x + 25, this.pos.y + 25);
        this.positions.forEach(x => {
            ctx.lineTo(x.x, x.y);
        })
        ctx.stroke();


        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(this.username, this.pos.x + 25, this.pos.y - 5, 200);
    }

    Update() {
        this.pos.x += (this.end.x - this.pos.x) * this.animation.speed;
        this.pos.y += (this.end.y - this.pos.y) * this.animation.speed;
    }

    Move(x, y) {
        this.end.x = x;
        this.end.y = y;
    }   

    MoveX(x) {
        this.end.x = x;
    }

    MoveY(y) {
        this.end.y = y;
    }

    Rotate(r) {
        this.pos.r = r;
    }
}

class PlayerShip extends Ship {
    constructor(x, y, r) {
        super(x, y, r);
    }
}

var ship = new PlayerShip(innerWidth / 2, innerHeight / 2, 40);





requestAnimationFrame(function update() {
    requestAnimationFrame(update);

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    ship.Draw(ctx);
});

setInterval(() => {
    ship.Update();
}, 20);


addEventListener('click', e => ship.Move(e.x, e.y));
addEventListener('mousemove', e => {
    ship.Rotate(Math.atan2(e.y - ship.pos.y, e.x - ship.pos.x));
});








var keys = {
    down: false,
    up: false,
    left: false,
    right: false
};

addEventListener('keydown', e => {
    // console.log(e.key);
    switch (e.key) {
        case 'w':
            keys.up = true;
            break;

        case 's':
            keys.down = true;
            break;

        case 'a':
            keys.left = true;
            break;

        case 'd':
            keys.right = true;
            break;
    
        default:
            break;
    }
});

addEventListener('keyup', e => {
    switch (e.key) {
        case 'w':
            keys.up = false;
            break;

        case 's':
            keys.down = false;
            break;

        case 'a':
            keys.left = false;
            break;

        case 'd':
            keys.right = false;
            break;
    
        default:
            break;
    }
});
