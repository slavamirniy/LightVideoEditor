function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let video = document.createElement('video');
video.src = 'source.mp4';
video.controls = true;
video.crossOrigin = "Anonymous";
video.style.display = 'none';
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
    metadata.scalewidth = metadata.width;
    metadata.scaleheight = metadata.height;
    metadata.pixilate = false
});

video.addEventListener('play', function() {
    let $this = this;
    (function loop() {
        if (!$this.paused && !$this.ended) {
            ctx.drawImage($this, 0, 0, metadata.scalewidth, metadata.scaleheight);

            if (metadata.pixilate) {
                ctx.drawImage(canvas, 0, 0, metadata.scalewidth / 2, metadata.scaleheight, 0, 0, metadata.width / 2, metadata.height);
                ctx.drawImage($this, metadata.width / 2, 0, metadata.width / 2, metadata.height, metadata.width / 2, 0, metadata.width / 2, metadata.height);
            }

            setTimeout(loop, 1000 / 30);
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

async function getFrames() {
    video.pause();

    let framesCount = Math.floor(video.duration)

    canvas.width = 500;
    canvas.height = 500;

    let q = Math.sqrt((canvas.width * canvas.height) / (metadata.width * metadata.height));
    let s = Math.ceil(Math.sqrt(framesCount));
    let frameHeight = q * (metadata.height / s);
    let frameWidth = q * (metadata.width / s);

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0, x = 0, y = 0; i <= framesCount; i++) {
        video.currentTime = i;
        await sleep(50);
        ctx.drawImage(video, x * frameWidth, y * frameHeight, frameWidth, frameHeight);
        x++;
        if ((x) * frameWidth > canvas.width) {
            y++
            x = 0
        }
    }
}

function upscale() {
    let size = 25 / 100;
    metadata.scalewidth = canvas.width * size;
    metadata.scaleheight = canvas.height * size;
    ctx.msImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    metadata.pixilate = true;
}

addBtn("Pause", x => video.pause());
addBtn("Play", x => video.play());
addBtn("Flip Horizontal", flipHorizontal);
addBtn("Flip Vertical", flipVertical);
addBtn("To Vertical", flipVertical);
addBtn("Get frames", getFrames);
addBtn("Upscale", upscale);