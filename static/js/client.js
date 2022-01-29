(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f0f';
    ctx.beginPath();
    ctx.rect(10, 20, 150, 100);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = '#00f';
    ctx.arc(20, 20, 20, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.textBaseline = "top";
    ctx.font = "17px Arial";
    ctx.textBaseline = "alphabetic";


    // copied from fingerprint.js code to render text to canvas
    // which will be used as part of the hash.
    txt = 'abz190#$%^@£éú';
    ctx.textBaseline = "top";
    ctx.font = '17px "Arial 17"';
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = '#ff0505';
    ctx.rotate(0.03);
    ctx.fillText(txt, 4, 17);
    ctx.fillStyle = '#13ff05';
    ctx.shadowBlur = 8;
    ctx.shadowColor = "red";
    ctx.fillRect(20, 12, 100, 5);
    

    src = canvas.toDataURL();
    hash = 0;

    for (let i = 0; i < src.length; i++) {
        char = src.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }

    globalThis.fingerprint = hash;

    var xhr = new XMLHttpRequest();

    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState == 403) {
            document.write("Your browser has been banned from the game 😁. Please contact an admin if it's a mistake >> https://discord.com/invite/RmnMANVVDn");
        }
    });

    xhr.open("POST", '/exile', true);
    xhr.setRequestHeader('Content-Type', "application/x-www-form-urlencoded");
    xhr.send(`fingerprint=${fingerprint}`);
})();