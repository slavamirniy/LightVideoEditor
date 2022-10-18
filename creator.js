class SimilarAnimation {
    constructor(width, height, source, type) {

        this.strategy = this._defaultNextFrame;

        this.type = type;

        this.animations = SimilarAnimation._getAnimationsDictionary(this)[type];
        this.timers = []

        this.animationName = null;

        this.pixilatePower = 0.5;
        this.isStarted = false;
        this.isLoaded = false;

        this.dividerPosition = 50; // from 1 to 100
        this.dividerPositionVX = 1;
        this.dividerMove = true;

        if (type == "video")
            this._startVideo(source);
        if (type == "image")
            this._startImage(source);

        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.owner = this;
        this.canvas = canvas;

        this.ctx = canvas.getContext('2d');

        this.playStrategy = function() {
            if (this.owner.type == 'video')
                this.owner.video.play();
            if (this.owner.type == 'image')
                this.owner.image.show();
        }

        this.canvas.play = this.playStrategy;

        this.canvas.destroy = function() {
            this.owner.destroy();
        }

        this.canvas.reset = function() {
            this.owner.ctx.reset();
            if (this.owner.type == 'video') {
                this.owner.video.playbackRate = 1;
                this.owner.video.pause();
            }
            this.owner.timers.forEach(timer => {
                window.clearTimeout(timer);
            });
            this.owner.isStarted = false;
            this.play = this.owner.playStrategy;
            this.owner.ctx.globalAlpha = 1;

            return this.owner;
        }

        canvas.addEventListener("mousemove", function(e) {
            this.owner.dividerMove = false;
            this.owner.dividerPosition = (e.x / canvas.width) * 100;
        })

        canvas.addEventListener("mouseout", function(e) {
            this.owner.dividerMove = true;
        })
    }

    static of(width, height, source, type) {
        let obj = new SimilarAnimation(width, height, source, type);
        return obj;
    }

    static _getAnimationsDictionary(self = {}) {
        return {
            "video": {
                "flipVertical": self._flipVerticalAnimation,
                "flipHorizontal": self._flipHorizontalAnimation,
                "slowMotion": self._slowAnimation,
                "fastMotion": self._fastAnimation,
                "getFrames": self._getFramesAnimation,
                "upscale": self._upscaleAnimation,
                "toVertical": self._toVerticalAnimation,
                "toVerticalRotate90": self._toVerticalRotate90Animation,
                "toHorizontal": self._toHorizontalAnimation,
                "colorCorrection_0": self._colorAnimation,
                "noiseAnimation": self._noiseAnimation,
                "stabilizationAnimation": self._stabilizationAnimation
            },
            "image": {
                "none": self._imageShow,
                "imageColorCorrection_0": self._imageColorCorrection,
                "imageFlipHorizontal": self._imageFlipHorizontal,
                "imageFlipVertical": self._imageFlipVertical
            }
        }
    }

    static getAnimationsNames(type) {
        return Object.keys(SimilarAnimation._getAnimationsDictionary()[type]);
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
        if (this.type == 'video')
            this.video.remove();
        if (this.type == 'iamge')
            this.video.remove();
    }

    _startImage(source) {
        this.imageSource = source;

        let image = new Image();
        image.src = source;
        image.owner = this;

        this.image = image;

        image.addEventListener('load', function() {
            let owner = this.owner;
            owner.imageWidth = this.width;
            owner.imageHeight = this.height;

            owner.scaledWidth = owner.canvas.width;
            owner.scaledHeight = owner.imageHeight * (owner.canvas.width / owner.imageWidth);

            owner.animations[owner.animationName](owner);
            owner.strategy(owner.scaledWidth, owner.scaledHeight, owner.ctx);
        })

        image.show = function() {
            let owner = this.owner;
            owner.animations[owner.animationName](owner);
            owner.strategy(owner.scaledWidth, owner.scaledHeight, owner.ctx);
        }
    }

    _startVideo(source) {
        let video = document.createElement('video');
        video.src = source;
        video.crossOrigin = "Anonymous";
        video.style.display = 'none';
        this.video = video;
        document.body.append(video);
        video.owner = this;

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

    _defaultNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        ctx.drawImage(this.video, 0, y, canvasScaledWidth, canvasScaledHeight);
    }

    _defaultShowImage(canvasScaledWidth, canvasScaledHeight, ctx) {
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        ctx.drawImage(this.image, 0, y, canvasScaledWidth, canvasScaledHeight);
    }

    _slowNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        ctx.globalAlpha = 0.2
        this.video.playbackRate = 0.3
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        ctx.drawImage(this.video, 0, y, canvasScaledWidth, canvasScaledHeight);
    }

    _verticalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx, rotation = 0) {
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

    _horizontalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let height = this.canvas.width * 9 / 16;
        let width = this.canvas.width;

        let cropWidth = this.videoWidth;
        let cropHeight = this.videoWidth * (9 / 16);

        let centerX = this.canvas.width / 2;
        let centerY = this.canvas.height / 2;

        ctx.drawImage(this.video, this.videoWidth / 2 - cropWidth / 2, 0, cropWidth, cropHeight,
            centerX - width / 2, centerY - height / 2, width, height);
    }

    _getDivider() {
        let value = this.dividerPosition

        if (this.dividerMove) {
            this.dividerPosition += this.dividerPositionVX;
            if (this.dividerPosition >= 100 || this.dividerPosition <= 1) {
                this.dividerPositionVX *= -1;
                if (this.dividerPosition >= 100) this.dividerPosition = 99;
                if (this.dividerPosition <= 1) this.dividerMove = 2;
            }
        }

        return { left: value / 100, right: (100 - value) / 100 };
    }

    _drawDivider(div, canvasScaledWidth, canvasScaledHeight, ctx) {
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'black';
        ctx.fillRect(canvasScaledWidth * div.left, y, 2, canvasScaledHeight);
        ctx.globalAlpha = 1;
    }

    _drawDividedImage(left, canvasScaledWidth, canvasScaledHeight, ctx) {
        let div = this._getDivider();
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        if (left)
            ctx.drawImage(this.video, 0, 0, this.videoWidth * div.left, this.videoHeight, 0, y, canvasScaledWidth * div.left, canvasScaledHeight);
        else {
            ctx.drawImage(this.video, this.videoWidth * div.left, 0, this.videoWidth * div.right, this.videoHeight, canvasScaledWidth * div.left, y, canvasScaledWidth * div.right, canvasScaledHeight);
            this._drawDivider(div, canvasScaledWidth, canvasScaledHeight, ctx);
        }
    }

    _blurNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        ctx.filter = 'blur(2px)'
        this._drawDividedImage(true, canvasScaledWidth, canvasScaledHeight, ctx)
        ctx.filter = 'blur(0px)'
        this._drawDividedImage(false, canvasScaledWidth, canvasScaledHeight, ctx)
    }

    _noiseNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let div = this._getDivider();
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        _SimilarAnimationHelpers.generateNoise(ctx, 0, y, canvasScaledWidth * div.left, canvasScaledHeight);
        ctx.globalAlpha = 0.8;
        this._defaultNextFrame(canvasScaledWidth, canvasScaledHeight, ctx);
        this._drawDivider(div, canvasScaledWidth, canvasScaledHeight, ctx);
    }

    _stabilizationNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let div = this._getDivider();
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        ctx.drawImage(this.video, (Math.sin(Date.now() / 300)) * 10, (Math.cos(Date.now() / 250)) * 7, this.videoWidth * div.left, this.videoHeight - 10, 0, y, canvasScaledWidth * div.left, canvasScaledHeight);
        ctx.drawImage(this.video, this.videoWidth * div.left + 10, 10, this.videoWidth * div.right - 10, this.videoHeight - 10, canvasScaledWidth * div.left, y, canvasScaledWidth * div.right, canvasScaledHeight);
        this._drawDivider(div, canvasScaledWidth, canvasScaledHeight, ctx);
    }

    _cropVerticalRotate90NextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        this._verticalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx, 90);
    }

    _upscaleAnimation(self) {
        self.strategy = self._blurNextFrame;
    }

    _flipHorizontalAnimation(self) {
        self.ctx.scale(1, -1);
        self.ctx.translate(0, -self.canvas.height);
        self.strategy = self._defaultNextFrame;
    }

    _flipVerticalAnimation(self) {
        self.ctx.scale(-1, 1);
        self.ctx.translate(-self.canvas.width, 0);
        self.strategy = self._defaultNextFrame;
    }

    _toVerticalRotate90Animation(self) {
        self.strategy = self._cropVerticalRotate90NextFrame;
    }

    _getFramesAnimation(self) {
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
        self.strategy = self._defaultNextFrame;
    }

    _toHorizontalAnimation(self) {
        self.strategy = self._horizontalCropNextFrame;
    }

    _toVerticalAnimation(self) {
        self.strategy = self._verticalCropNextFrame;
    }

    _colorAnimation(self) {
        self.ctx.filter = 'contrast(120%) saturate(120%)'
        self.strategy = self._defaultNextFrame;
    }

    _imageColorCorrection(self) {
        self.ctx.filter = 'contrast(120%) saturate(120%)'
        self.strategy = self._defaultShowImage;
    }

    _imageFlipVertical(self) {
        self.ctx.scale(-1, 1);
        self.ctx.translate(-self.canvas.width, 0);
        self.strategy = self._defaultShowImage;
    }

    _imageFlipHorizontal(self) {
        self.ctx.scale(1, -1);
        self.ctx.translate(0, -self.canvas.height);
        self.strategy = self._defaultShowImage;
    }

    _slowAnimation(self) {
        self.strategy = self._slowNextFrame;
    }

    _fastAnimation(self) {
        self.video.playbackRate = 2;
        self.strategy = self._defaultNextFrame;
    }

    _noiseAnimation(self) {
        self.strategy = self._noiseNextFrame;
    }

    _stabilizationAnimation(self) {
        self.strategy = self._stabilizationNextFrame;
    }

    _imageShow(self) {
        self.strategy = self._defaultShowImage;
    }

}

class _SimilarAnimationHelpers {
    static generateNoise(ctx, x, y, w, h) {
        let idata = ctx.createImageData(w, h)

        let buffer32 = new Uint32Array(idata.data.buffer),
            buffer_len = buffer32.length,
            i = 0

        for (; i < buffer_len; i++)
            buffer32[i] =
            ((255 * Math.random()) | 0) << 24;
        ctx.putImageData(idata, x, y);
    }

    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
}