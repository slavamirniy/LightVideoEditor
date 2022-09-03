function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// destroy method

class SimilarAnimation {
    constructor(width, height, source) {

        this.pixilate = false;
        this.pixilatePower = 0.2;

        this.isVertical = false;

        let video = document.createElement('video');
        video.src = source;
        video.crossOrigin = "Anonymous";
        video.style.display = 'none';
        this.video = video;
        document.body.append(video);
        video.owner = this;

        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.owner = this;
        this.canvas = canvas;

        this.ctx = canvas.getContext('2d');

        this.canvas.play = function() {
            this.owner.video.play();
        };

        video.addEventListener('loadedmetadata', function() {
            const owner = this.owner;

            owner.videoWidth = video.videoWidth;
            owner.videoHeight = video.videoHeight;

            owner.scaledWidth = owner.videoWidth;
            owner.scaledHeight = owner.videoHeight;
        });

        video.addEventListener('play', function() {
            let $this = this;
            let owner = this.owner;
            (function loop() {
                if (!$this.paused && !$this.ended) {
                    owner.ctx.fillRect(0, 0, owner.canvas.width, owner.canvas.height)

                    owner.nextFrame();

                    setTimeout(loop, 1000 / 30);
                }
            })();
        }, 0);

        video.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
    }

    nextFrame() {
        let ctx = this.ctx;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        let canvasScaledWidth = this.canvas.width;
        let canvasScaledHeight = this.scaledHeight * (canvasScaledWidth / this.scaledWidth);
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);

        if (this.isVertical) {
            ctx.fillStyle = 'black';
            let width = this.canvas.height * 9 / 16;
            let height = this.videoHeight * (width / this.videoWidth);
            let x = this.canvas.width / 2 - this.canvas.height * 9 / 16 / 2
            ctx.fillRect(x, 0, width, this.canvas.height)
            ctx.drawImage(this.video, x, this.canvas.height / 2 - height / 2, width, height);
        } else
            ctx.drawImage(this.video, 0, y, canvasScaledWidth, canvasScaledHeight);

        if (this.pixilate) {
            ctx.drawImage(this.video, 0, y, canvasScaledWidth * this.pixilatePower, canvasScaledHeight * this.pixilatePower);
            ctx.drawImage(this.canvas, 0, y, canvasScaledWidth * this.pixilatePower / 2, canvasScaledHeight * this.pixilatePower,
                0, y, canvasScaledWidth / 2, canvasScaledHeight);
        }
    }

    static of(width, height, source) {
        let obj = new SimilarAnimation(width, height, source);
        return obj;
    }

    pixilateAnimation() {
        this.pixilate = true;
        return this.canvas;
    }

    flipHorizontalAnimation() {
        this.ctx.scale(1, -1);
        this.ctx.translate(0, -this.canvas.height);

        return this.canvas;
    }

    flipVerticalAnimation() {
        this.ctx.scale(-1, 1);
        this.ctx.translate(-this.canvas.width, 0);

        return this.canvas;
    }

    getFramesAnimation() {
        this.video.pause();

        this.canvas.play = function() {
            const owner = this.owner;

            let framesCount = Math.floor(owner.video.duration)

            let q = Math.sqrt((owner.canvas.width * owner.canvas.height) / (owner.videoWidth * owner.videoHeight));
            let s = Math.ceil(Math.sqrt(framesCount));
            let frameHeight = q * (owner.videoHeight / s);
            let frameWidth = q * (owner.videoWidth / s);

            owner.ctx.fillRect(0, 0, owner.canvas.width, owner.canvas.height);
            for (let i = 0, x = 0, y = 0; i <= framesCount; i++) {
                owner.video.currentTime = 0;
                setTimeout(function(i, a, b, c, d) {
                    owner.video.currentTime = i;
                    owner.ctx.drawImage(owner.video, a, b, c, d);
                }, (i + 1) * 50, i, x * frameWidth, y * frameHeight, frameWidth, frameHeight);
                x++;
                if (x * frameWidth > owner.canvas.width) {
                    y++
                    x = 0
                }
            }
        }

        return this.canvas;
    }

    upscaleAnimation() {
        let size = 25 / 100;
        this.scaledWidth = canvas.width * size;
        this.scaledHeight = canvas.height * size;
        this.ctx.msImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;
        this.pixilate = true;

        return this.canvas;
    }

    toVerticalAnimation() {
        this.isVertical = true;

        return this.canvas;
    }

    colorAnimation() {
        this.ctx.filter = 'contrast(120%) saturate(120%)'

        return this.canvas;
    }

}

class Test {
    constructor(w, h) {
        let canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.owner = this;
        this.canvas = canvas;

        this.ctx = canvas.getContext('2d');

        this.canvas.play = function() {
            this.owner.ctx.fillRect(0, 0, 100, 100)
        }
    }

    static of(w, h) {
        return new Test(w, h)
    }
}