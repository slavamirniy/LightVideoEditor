const vectorizer_image = new Image()
vectorizer_image.src = "/vectorizer.png"
class SimilarAnimation {
    constructor(width, height, source, images_path = { vectorizer: "/vectorizer.png" }) {

        vectorizer_image.src = images_path.vectorizer || vectorizer_image.src

        let type = _SimilarAnimationHelpers.getTypeFromSource(source);
        if (type == null)
            return

        this.strategy = this._defaultNextFrame;

        this.type = type;

        this.animations = SimilarAnimation._getAnimationsDictionary(this)[type];
        this.timers = []

        this.animationName = "none";

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
        this.ctx.save();

        this.playStrategy = function() {
            if (this.owner.type == 'video')
                this.owner.video.play();
            if (this.owner.type == 'image')
                this.owner.image.show();
        }

        this.canvas.play = this.playStrategy;
        this.canvas.getAnimationsNames = () => SimilarAnimation.getAnimationsNames(this.type);
        this.getAnimationsNames = () => SimilarAnimation.getAnimationsNames(this.type);

        this.canvas.destroy = function() {
            this.owner.destroy();
        }

        this.canvas.reset = function() {
            this.owner.reset();
            if (this.owner.type == 'video') {
                this.owner.video.playbackRate = 1;
                this.owner.video.pause();
            }
            this.owner.timers.forEach(timer => {
                window.clearTimeout(timer);
            });
            this.owner.timers = []
            this.owner.isStarted = false;
            this.play = this.owner.playStrategy;
            this.owner.ctx.globalAlpha = 1;
            this.owner.animationName = "none";

            return this.owner;
        }

        this.reset = () => {
            this.ctx.restore();
            this.ctx.resetTransform();
            this.ctx.clearRect(0, 0, width, height)
            this.ctx.filter = 'contrast(100%) saturate(100%)'
        }

        canvas.addEventListener("mousemove", function(e) {
            this.owner.dividerMove = false;
            this.owner.dividerPosition = (e.x / canvas.width) * 100;
        })

        canvas.addEventListener("mouseout", function(e) {
            this.owner.dividerMove = true;
        })
    }

    static of(width, height, source, images_path) {
        let obj = new SimilarAnimation(width, height, source, images_path);
        return obj.canvas;
    }

    static _getAnimationsDictionary(self = {}) {
        return {
            "video": {
                "none": self._videoShow,
                "flipVertical": self._flipVerticalAnimation,
                "flipHorizontal": self._flipHorizontalAnimation,
                "slowMotion": self._slowAnimation,
                "fastMotion": self._fastAnimation,
                "getFrames": self._getFramesAnimation,
                "upscale": self._upscaleAnimation,
                "toVertical": self._toVerticalAnimation,
                "toVerticalRotate90": self._toVerticalRotate90Animation,
                "toVerticalRotate270": self._toVerticalRotate270Animation,
                "toHorizontal": self._toHorizontalAnimation,
                "colorCorrection_0": self._colorAnimation,
                "noiseAnimation": self._noiseAnimation,
                "stabilizationAnimation": self._stabilizationAnimation
            },
            "image": {
                "none": self._imageShow,
                "colorCorrection_0": self._imageColorCorrection,
                "flipHorizontal": self._imageFlipHorizontal,
                "flipVertical": self._imageFlipVertical,
                "vectorizer": self._imageVectorizer,
                "upscale": self._imageUpscale,
                "toVertical": self._imageToVertical,
                "rotate90": self._imageRotate90,
                "rotate270": self._imageRotate270
            }
        }
    }

    static getAnimationsNames(type) {
        return Object.keys(SimilarAnimation._getAnimationsDictionary()[type]);
    }

    getAnimationsNames() {
        return SimilarAnimation.getAnimationsNames(this.type);
    }

    setAnimation(name) {
        if (!(name in this.animations)) {
            console.error(name + ' animation not found!');
        }

        this.animationName = name;
        this.animations[name](this);
        return this.canvas;
    }

    destroy() {
        this.canvas.remove();
        if (this.type == 'video')
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

            let hRatio = owner.canvas.width / this.width;
            let vRatio = owner.canvas.height / this.height;
            let ratio = Math.min(hRatio, vRatio);

            owner.scaledWidth = this.width * ratio;
            owner.scaledHeight = this.height * ratio;

            owner.animations[owner.animationName](owner);
            owner.strategy(owner.scaledWidth, owner.scaledHeight, owner.ctx);
        })

        image.show = function() {
            let owner = this.owner;

            owner.strategy(owner.scaledWidth, owner.scaledHeight, owner.ctx);
            owner.animations[owner.animationName](owner);
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
                if (owner.animationName)
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

                    let canvasScaledWidth
                    let canvasScaledHeight

                    let hRatio = owner.canvas.width / owner.scaledWidth;
                    let vRatio = owner.canvas.height / owner.scaledHeight;
                    let ratio = Math.min(hRatio, vRatio);

                    canvasScaledWidth = owner.scaledWidth * ratio
                    canvasScaledHeight = owner.scaledHeight * ratio

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
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);
        ctx.drawImage(this.video, x, y, canvasScaledWidth, canvasScaledHeight);
    }

    _defaultShowImage(canvasScaledWidth, canvasScaledHeight, ctx) {
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);
        ctx.drawImage(this.image, x, y, canvasScaledWidth, canvasScaledHeight);
    }

    _slowNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        ctx.globalAlpha = 0.2
        this.video.playbackRate = 0.3
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);
        ctx.drawImage(this.video, x, y, canvasScaledWidth, canvasScaledHeight);
    }

    _verticalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx, rotation = 0) {
        let height = this.videoHeight;
        let width = height * 9 / 16;

        let hRatio = this.canvas.width / width;
        let vRatio = this.canvas.height / height;
        let ratio = Math.min(hRatio, vRatio);

        let w = width * ratio
        let h = this.videoHeight * ratio
        let y = 0.5 * (this.canvas.height - h);
        let x = 0.5 * (this.canvas.width - w);

        const rot = rotation * Math.PI / 180
        if (rotation == 90 || rotation == 270) {
            ctx.setTransform(1, 0, 0, 1, this.canvas.width / 2, this.canvas.height / 2);
            ctx.rotate(rot);
            ratio = Math.min(this.canvas.width / h, this.canvas.height / w);
            ctx.drawImage(this.video, this.videoWidth / 2 - width / 2, 0, width, height, -y - w * ratio / 2, -h * ratio / 2, w * ratio, h * ratio);
        }
        if (rotation == 0)
            ctx.drawImage(this.video, this.videoWidth / 2 - width / 2, 0, width, height, x, y, w, h);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    _horizontalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let height = this.videoHeight * 9 / 16;

        let hRatio = this.canvas.width / this.videoWidth;
        let vRatio = this.canvas.height / height;
        let ratio = Math.min(hRatio, vRatio);

        let w = this.videoWidth * ratio
        let h = height * ratio

        let y = 0.5 * (this.canvas.height - h);
        let x = 0.5 * (this.canvas.width - w);

        console.log(w, h)

        ctx.drawImage(this.video, 0, this.videoHeight / 2 - height / 2, this.videoWidth, height,
            x, y, w, h);
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
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'black';
        ctx.fillRect(canvasScaledWidth * div.left + x, y, 2, canvasScaledHeight);
        ctx.globalAlpha = 1;
    }

    _drawDividedImage(left, canvasScaledWidth, canvasScaledHeight, ctx) {
        let div = this._getDivider();
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);
        if (left) {
            ctx.drawImage(this.video, 0, 0, this.videoWidth * div.left, this.videoHeight, x, y, canvasScaledWidth * div.left, canvasScaledHeight);
        } else {
            ctx.drawImage(this.video, this.videoWidth * div.left, 0, this.videoWidth * div.right, this.videoHeight, canvasScaledWidth * div.left + x, y, canvasScaledWidth * div.right, canvasScaledHeight);
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
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);
        _SimilarAnimationHelpers.generateNoise(ctx, x, y, canvasScaledWidth * div.left, canvasScaledHeight);
        ctx.globalAlpha = 0.8;
        this._defaultNextFrame(canvasScaledWidth, canvasScaledHeight, ctx);
        this._drawDivider(div, canvasScaledWidth, canvasScaledHeight, ctx);
    }

    _stabilizationNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let div = this._getDivider();
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);
        ctx.drawImage(this.video, (Math.sin(Date.now() / 300)) * 10, (Math.cos(Date.now() / 250)) * 7, this.videoWidth * div.left, this.videoHeight - 10, x, y, canvasScaledWidth * div.left, canvasScaledHeight);
        ctx.drawImage(this.video, this.videoWidth * div.left + 10, 10, this.videoWidth * div.right - 10, this.videoHeight - 10, canvasScaledWidth * div.left + x, y, canvasScaledWidth * div.right, canvasScaledHeight);
        this._drawDivider(div, canvasScaledWidth, canvasScaledHeight, ctx);
    }

    _cropVerticalRotate90NextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        this._verticalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx, 90);
    }

    _cropVerticalRotate270NextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        this._verticalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx, 270);
    }

    _upscaleAnimation(self) {
        self.strategy = self._blurNextFrame;
    }

    _flipVerticalAnimation(self) {
        self.ctx.scale(1, -1);
        self.ctx.translate(0, -self.canvas.height);
        self.strategy = self._defaultNextFrame;
    }

    _flipHorizontalAnimation(self) {
        self.ctx.scale(-1, 1);
        self.ctx.translate(-self.canvas.width, 0);
        self.strategy = self._defaultNextFrame;
    }

    _toVerticalRotate90Animation(self) {
        self.strategy = self._cropVerticalRotate90NextFrame;
    }

    _toVerticalRotate270Animation(self) {
        self.strategy = self._cropVerticalRotate270NextFrame;
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

    _imageFlipHorizontal(self) {
        self.ctx.scale(-1, 1);
        self.ctx.translate(-self.canvas.width, 0);
        self.strategy = self._defaultShowImage;
    }

    _imageFlipVertical(self) {
        self.ctx.scale(1, -1);
        self.ctx.translate(0, -self.canvas.height);
        self.strategy = self._defaultShowImage;
    }

    _imageVectorizer(self) {
        self.strategy = self._imageVectorizerShowImage;
    }

    _imageVectorizerShowImage(canvasScaledWidth, canvasScaledHeight, ctx) {
        let width = vectorizer_image.width * ctx.canvas.height / vectorizer_image.height
        ctx.drawImage(vectorizer_image, width / 2, 0, width, ctx.canvas.height)
    }

    _imageUpscale(self) {
        self.strategy = self._blurShowImage;
    }

    _blurShowImage(canvasScaledWidth, canvasScaledHeight, ctx) {
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);

        ctx.filter = 'blur(2px)'
        ctx.drawImage(this.image, 0, 0, this.image.width / 2, this.image.height, x, y, canvasScaledWidth / 2, canvasScaledHeight);
        ctx.filter = 'blur(0px)'
        ctx.drawImage(this.image, this.image.width / 2, 0, this.image.width / 2, this.image.height, x + canvasScaledWidth / 2, y, canvasScaledWidth / 2, canvasScaledHeight);
        this._drawDivider({ left: 0.5 }, canvasScaledWidth, canvasScaledHeight, ctx);
    }

    _imageToVertical(self) {
        self.strategy = self._toVerticalShowImage;
    }

    _toVerticalShowImage(canvasScaledWidth, canvasScaledHeight, ctx) {
        let height = this.image.height;
        let width = height * 9 / 16;

        let hRatio = this.canvas.width / width;
        let vRatio = this.canvas.height / height;
        let ratio = Math.min(hRatio, vRatio);

        let w = width * ratio
        let h = this.image.height * ratio
        let y = 0.5 * (this.canvas.height - h);
        let x = 0.5 * (this.canvas.width - w);
        ctx.drawImage(this.image, this.image.width / 2 - width / 2, 0, width, height, x, y, w, h);
    }

    _imageRotate90(self) {
        const rot = 90 * Math.PI / 180
        self.ctx.setTransform(1, 0, 0, 1, self.canvas.width / 2, self.canvas.height / 2);
        self.ctx.rotate(rot);
        self.strategy = self._rotatetedShowImage;
    }

    _rotatetedShowImage(canvasScaledWidth, canvasScaledHeight, ctx) {
        let height = this.image.height;
        let width = this.image.width;

        let hRatio = this.canvas.width / width;
        let vRatio = this.canvas.height / height;
        let ratio = Math.min(hRatio, vRatio);

        let w = width * ratio
        let h = height * ratio
        let y = 0.5 * (this.canvas.height - h);

        ratio = Math.min(this.canvas.width / h, this.canvas.height / w);
        ctx.drawImage(this.image, -y - w * ratio / 2, -h * ratio / 2, w * ratio, h * ratio);
    }

    _imageRotate270(self) {
        const rot = 270 * Math.PI / 180
        self.ctx.setTransform(1, 0, 0, 1, self.canvas.width / 2, self.canvas.height / 2);
        self.ctx.rotate(rot);
        self.strategy = self._rotatetedShowImage;
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

    _videoShow(self) {
        self.strategy = self._defaultNextFrame;
    }

    _imageShow(self) {
        self.strategy = self._defaultShowImage;
    }
}

let cashedNoise = {}

class _SimilarAnimationHelpers {
    static getNoiseFramesCount() {
        return 5
    }

    static generateNoise(ctx, x, y, w, h) {
        const d = w + "|" + h;
        if (d in cashedNoise) {
            const draw_data = cashedNoise[d][Math.floor(Math.random() * _SimilarAnimationHelpers.getNoiseFramesCount())]
            ctx.putImageData(draw_data, x, y);
            return
        }
        cashedNoise[d] = []
        for (let i = _SimilarAnimationHelpers.getNoiseFramesCount(); i > 0; i--) {
            let idata = ctx.createImageData(w, h)
            let buffer32 = new Uint32Array(idata.data.buffer),
                buffer_len = buffer32.length,
                i = 0

            for (; i < buffer_len; i++)
                buffer32[i] =
                ((255 * Math.random()) | 0) << 24;
            cashedNoise[d].push(idata)
        }
        this.generateNoise(ctx, x, y, w, h)
    }

    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static getTypeFromSource(s) {
        let filetype = s.split(".").reverse()[0];
        if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'avif', 'apng', 'bmp', 'ico', 'tiff'].includes(filetype))
            return 'image'
        if (['mp4', 'webm', 'ogv'].includes(filetype))
            return 'video'
        console.error('Unknown filetype for similar - SOURCE:' + s + '\n FILETYPE:' + filetype);
        return false
    }
}