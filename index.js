let video = document.createElement('video');
video.src = 'source.mp4';
video.controls = true;
video.crossOrigin = "Anonymous";
document.body.append(video);

let canvas = document.createElement('canvas');
document.body.append(canvas);

let ctx = canvas.getContext('2d');

let metadata = {}

video.addEventListener('loadedmetadata', function() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    metadata.width = video.videoWidth;
    metadata.height = video.videoHeight;
});

video.addEventListener('play', function() {
    let $this = this;
    video.style.display = 'none';
    (function loop() {
        if (!$this.paused && !$this.ended) {
            ctx.drawImage($this, 0, 0);
            setTimeout(loop, 1000 / 30); // drawing at 30fps
        }
    })();
}, 0);

video.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
}, false);

let btns = document.createElement('div')
document.body.append(btns)

function addBtn(name, method) {
    let btn = document.createElement('button');
    btn.innerText = name;
    btn.addEventListener('click', function(e) { method() });

    btns.appendChild(btn);
}

function flipHorizontal() {
    ctx.scale(1, -1);
    ctx.translate(0, -metadata.height);
}

function flipVertical() {
    ctx.scale(-1, 1);
    ctx.translate(-metadata.width, 0);
}

function getFrame() {
    canvas.style.display = 'none';
    video.style.display = 'block';
    btns.innerHTML = '';
    addBtn('Cut this frame', function() {
        var image = new Image();
        image.src = canvas.toDataURL();
        document.body.append(image);
    })
}

addBtn("Pause", x => video.pause());
addBtn("Play", x => video.play());
addBtn("Flip Horizontal", flipHorizontal);
addBtn("Flip Vertical", flipVertical);
addBtn("To Vertical", flipVertical);
addBtn("Get frame", getFrame);