(() => {
    globalThis.ships = {
        get style(i) {
            var img = new Image();
            img.src = `ships/${i}.svg`;
            return img;
        }
    };
})();