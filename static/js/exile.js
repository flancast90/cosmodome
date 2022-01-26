window.addEventListener('load', function() {   
    var fingerprint_canvas = document.getElementById("fingerprint");
    var context = fingerprint_canvas.getContext("2d");

    context.fillStyle = "rgb(255,0,255)";
    context.beginPath();
    context.rect(10, 20, 150, 100);
    context.fill();
    context.stroke();
    context.closePath();
    context.beginPath();
    context.fillStyle = "rgb(0,0,255)";
    context.arc(20, 20, 20, 0, Math.PI * 2, true);
    context.fill();
    context.stroke();   
    context.closePath();

    // copied from fingerprint.js code to render text to canvas
    // which will be used as part of the hash.
    txt = 'abz190#$%^@£éú';
    context.textBaseline = "top";
    context.font = '17px "Arial 17"';
    context.textBaseline = "alphabetic";
    context.fillStyle = "rgb(255,5,5)";
    context.rotate(.03);
    context.fillText(txt, 4, 17);
    context.fillStyle = "rgb(155,255,5)";
    context.shadowBlur=8;
    context.shadowColor="red";
    context.fillRect(20,12,100,5);

    // simple hashing function suggested by fingerprint.js
    src = fingerprint_canvas.toDataURL();
    hash = 0;

    for (i = 0; i < src.length; i++) {
	    char = src.charCodeAt(i);
	    hash = ((hash<<5)-hash)+char;
	    hash = hash & hash;
    }

    var fingerprint = hash;

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
           if (xmlhttp.status == 200) {
               console.log("ExileJS: Fingerprinted and user not banned.")
           }
           else if (xmlhttp.status == 403) {
              console.log("ExileJS: Fingerprint is blacklisted")
              document.write("Your browser has been blacklisted from this game. If you think this may be a mistake, please contact the domain Admin.");
           }
           
        }
    }

        xmlhttp.open("POST", "/exile", true);
        xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xmlhttp.send("fingerprint="+fingerprint);

    document.getElementById('fingerprint').remove();
});
