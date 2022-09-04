class SimilarAnimation {
    constructor(width, height, source) {

        this.strategy = this.defaultNextFrame;

        this.animations = SimilarAnimation.getAnimationsDictionary(this);
        this.timers = []

        this.animationName = null;

        this.pixilatePower = 0.5;
        this.isStarted = false;
        this.isLoaded = false;

        this.dividerPosition = 50; // from 1 to 100
        this.dividerPositionVX = 1;

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

        this.canvas.destroy = function() {
            this.owner.destroy();
        }

        this.canvas.reset = function() {
            this.owner.ctx.reset();
            this.owner.video.playbackRate = 1;
            this.owner.timers.forEach(timer => {
                window.clearTimeout(timer);
            });
            this.owner.isStarted = false;
            this.owner.video.pause();
            this.play = function() {
                this.owner.video.play();
            };
            this.owner.ctx.globalAlpha = 1;

            return this.owner;
        }

        video.addEventListener('loadedmetadata', function() {
            const owner = this.owner;

            owner.videoWidth = video.videoWidth;
            owner.videoHeight = video.videoHeight;

            owner.scaledWidth = owner.videoWidth;
            owner.scaledHeight = owner.videoHeight;

            if (this.readyState >= 3) {
                owner.isLoaded = true;
                owner.animations[owner.animationName](owner);
            }
        });

        video.addEventListener('play', function() {
            let $this = this;
            let owner = this.owner;
            if (owner.isStarted) return;
            owner.isStarted = true;
            (function loop() {
                if (!$this.paused && !$this.ended) {
                    let canvasScaledWidth = owner.canvas.width;
                    let canvasScaledHeight = owner.scaledHeight * (canvasScaledWidth / owner.scaledWidth);

                    owner.strategy(canvasScaledWidth, canvasScaledHeight, owner.ctx);

                    let timer = setTimeout(loop, 1000 / 30);
                    owner.timers.push(timer);
                }
            })();
        }, 0);

        video.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
    }

    static of(width, height, source) {
        let obj = new SimilarAnimation(width, height, source);
        return obj;
    }

    static getAnimationsDictionary(self = {}) {
        return {
            "flipVertical": self.flipVerticalAnimation,
            "flipHorizontal": self.flipHorizontalAnimation,
            "slowMotion": self.slowAnimation,
            "fastMotion": self.fastAnimation,
            "getFrames": self.getFramesAnimation,
            "upscale": self.upscaleAnimation,
            "toVertical": self.toVerticalAnimation,
            "toVerticalRotate90": self.toVerticalRotate90Animation,
            "colorCorrection_0": self.colorAnimation,
        }
    }

    static getAnimationsNames() {
        return Object.keys(SimilarAnimation.getAnimationsDictionary());
    }

    defaultNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        ctx.drawImage(this.video, 0, y, canvasScaledWidth, canvasScaledHeight);
    }

    slowNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        ctx.globalAlpha = 0.2
        this.video.playbackRate = 0.3
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        ctx.drawImage(this.video, 0, y, canvasScaledWidth, canvasScaledHeight);
    }

    verticalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx, rotation = 0) {
        ctx.fillStyle = 'black';

        let height = this.canvas.height;
        let width = height * 9 / 16;

        let cropWidth = this.videoHeight * (9 / 16);
        let cropHeight = this.videoHeight;

        if (rotation == 90 || rotation == 270)
            height = [this.canvas.width, width = height * width / this.canvas.width][0]

        let x = this.canvas.width / 2 - height * 9 / 16 / 2
        let centerX = this.canvas.width / 2;
        let centerY = this.canvas.height / 2;

        ctx.translate(centerX, centerY);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-centerX, -centerY);
        ctx.drawImage(this.video, this.videoWidth / 2 - cropWidth / 2, 0, cropWidth, cropHeight,
            centerX - width / 2, centerY - height / 2, width, height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

    }

    blurNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);

        ctx.filter = 'blur(2px)'
        ctx.drawImage(this.video, 0, 0, this.videoWidth * this.dividerPosition / 100, this.videoHeight, 0, y, canvasScaledWidth * this.dividerPosition / 100, canvasScaledHeight);
        ctx.filter = 'blur(0px)'
        ctx.drawImage(this.video, this.videoWidth * this.dividerPosition / 100, 0, this.videoWidth * (100 - this.dividerPosition) / 100, this.videoHeight, canvasScaledWidth * this.dividerPosition / 100, y, canvasScaledWidth * (100 - this.dividerPosition) / 100, canvasScaledHeight);


        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'black';
        ctx.fillRect(canvasScaledWidth * this.dividerPosition / 100, y, 2, canvasScaledHeight);
        ctx.globalAlpha = 1;

        this.dividerPosition += this.dividerPositionVX;
        if (this.dividerPosition > 100 || this.dividerPosition < 0)
            this.dividerPositionVX *= -1;
    }

    pixilateNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        this.defaultNextFrame(canvasScaledWidth, canvasScaledHeight, ctx);

        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        ctx.drawImage(this.video, 0, 0, this.videoWidth * this.dividerPosition / 100, this.videoHeight, 0, y, canvasScaledWidth * this.pixilatePower * this.dividerPosition / 100, canvasScaledHeight * this.pixilatePower);
        ctx.drawImage(this.canvas, 0, y, canvasScaledWidth * this.pixilatePower * this.dividerPosition / 100, canvasScaledHeight * this.pixilatePower,
            0, y, canvasScaledWidth * this.dividerPosition / 100, canvasScaledHeight);

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'black';
        ctx.fillRect(canvasScaledWidth * this.dividerPosition / 100, y, 2, canvasScaledHeight);
        ctx.globalAlpha = 1;

        this.dividerPosition += this.dividerPositionVX;
        if (this.dividerPosition > 100 || this.dividerPosition < 0)
            this.dividerPositionVX *= -1;
    }

    cropVerticalRotate90NextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        this.verticalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx, 90);
    }

    upscaleAnimation(self) {
        self.strategy = self.blurNextFrame;
    }

    flipHorizontalAnimation(self) {
        self.ctx.scale(1, -1);
        self.ctx.translate(0, -self.canvas.height);
        self.strategy = self.defaultNextFrame;
    }

    flipVerticalAnimation(self) {
        self.ctx.scale(-1, 1);
        self.ctx.translate(-self.canvas.width, 0);
        self.strategy = self.defaultNextFrame;
    }

    toVerticalRotate90Animation(self) {
        self.strategy = self.cropVerticalRotate90NextFrame;
    }

    getFramesAnimation(self) {
        self.video.pause();

        self.canvas.play = function() {
            const owner = this.owner;

            let framesCount = Math.floor(owner.video.duration)

            let q = Math.sqrt((owner.canvas.width * owner.canvas.height) / (owner.videoWidth * owner.videoHeight));
            let s = Math.ceil(Math.sqrt(framesCount));
            let frameHeight = q * (owner.videoHeight / s);
            let frameWidth = q * (owner.videoWidth / s);

            owner.ctx.fillRect(0, 0, owner.canvas.width, owner.canvas.height);
            for (let i = 0, x = 0, y = 0; i <= framesCount; i++) {
                owner.video.currentTime = 0;
                let timer = window.setTimeout(function(i, a, b, c, d) {
                    owner.video.currentTime = i;
                    owner.ctx.drawImage(owner.video, a, b, c, d);
                    // owner.ctx.drawImage(owner.video, 0, 0, owner.canvas.width, owner.canvas.height)
                    // if (i % 2 == 1) owner.ctx.fillRect(0, 0, owner.canvas.width, owner.canvas.height)
                }, (i + 1) * 200, i, x * frameWidth, y * frameHeight, frameWidth, frameHeight);
                owner.timers.push(timer);
                x++;
                if (x * frameWidth > owner.canvas.width) {
                    y++
                    x = 0
                }
            }
        }
        self.strategy = self.defaultNextFrame;
    }

    toVerticalAnimation(self) {
        self.strategy = self.verticalCropNextFrame;
    }

    colorAnimation(self) {
        self.ctx.filter = 'contrast(120%) saturate(120%)'
        self.strategy = self.defaultNextFrame;
    }

    slowAnimation(self) {
        self.strategy = self.slowNextFrame;
    }

    fastAnimation(self) {
        self.video.playbackRate = 2;
        self.strategy = self.defaultNextFrame;
    }

    setAnimation(name) {
        if (!(name in this.animations)) {
            console.error(name + ' animation not found!');
        }

        this.animationName = name;
        if (this.isLoaded)
            this.animations[name](this);
        return this.canvas;
    }

    destroy() {
        this.canvas.remove();
        this.video.remove();
    }

}