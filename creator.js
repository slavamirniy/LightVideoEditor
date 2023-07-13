const vectorizer_image = new Image()
const greenscreen_image = new Image()

class SimilarAnimation {
    constructor(width, height, source, images_path = { vectorizer: "/vectorizer.png", greenscreen: "/greenscreen.png" }) {

        vectorizer_image.src = images_path.vectorizer
        greenscreen_image.src = images_path.greenscreen

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

        this.isDrawVideoDuration = true;

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
            this.timers.forEach(timer => {
                window.clearTimeout(timer);
            });
            this.timers = []
            this.ctx.clearRect(0, 0, width, height)
            this.ctx.filter = 'contrast(100%) saturate(100%)'

            return this
        }

        this.showFrame = function(s, clearPrevious = true) {
            return new Promise((res) => {
                if (this.type != 'video') {
                    console.error("Trying to show frame of not video")
                    res()
                    return
                }

                if (clearPrevious)
                    this.reset()
                this.video.pause()
                this.video.currentTime = s
                this.strategy = this._videoShow

                let canvasScaledWidth
                let canvasScaledHeight

                let hRatio = this.canvas.width / this.scaledWidth;
                let vRatio = this.canvas.height / this.scaledHeight;
                let ratio = Math.min(hRatio, vRatio);

                canvasScaledWidth = this.scaledWidth * ratio
                canvasScaledHeight = this.scaledHeight * ratio

                this.video.onseeked = () => {
                    this._defaultNextFrame(canvasScaledWidth, canvasScaledHeight, this.ctx)
                    this.video.onseeked = null
                    res()
                }
            })

        }

        this.canvas.showFrame = (s, cp = true) => this.showFrame(s, cp)

        this.showFramePercent = function(percent, clearPrevious = true) {
            return new Promise((res) => {
                if (this.type != 'video') {
                    console.error("Trying to show frame of not video")
                    res()
                    return
                }

                if (this.video.readyState >= 3) {
                    this.showFrame(this.video.duration * percent / 100, clearPrevious).then(_ => res())
                    return
                }

                this.video.addEventListener('loadeddata', (e) => {
                    if (e.target.readyState >= 3) {
                        e.target.owner.showFrame(e.target.duration * percent / 100, clearPrevious).then(_ => res())
                    }
                });
            })
        }

        this.canvas.showFramePercent = (percent, cp = true) => this.showFramePercent(percent, cp)


        canvas.addEventListener("mousemove", function(e) {
            this.owner.dividerMove = false;
            let mouseX;

            if (e.offsetX) {
                mouseX = e.offsetX;
            } else if (e.layerX) {
                mouseX = e.layerX;
            }
            this.owner.dividerPosition = (mouseX / canvas.width) * 100;
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
                "cropCenter": self._crop2Animation,
                "get3Frames": self._get3FramesAnimation,
                "getFrames": self._get4FramesAnimation,
                "flipVertical": self._flipVerticalAnimation,
                "flipHorizontal": self._flipHorizontalAnimation,
                "slowMotion": self._slowAnimation,
                "fastMotion": self._fastAnimation, // сука не менят, или менят, но менять drawVideoDuration
                "getFramesLegacy": self._getFramesAnimation,
                "upscale": self._upscaleAnimation,
                "toVertical": self._toVerticalAnimation,
                "toVerticalRotate90": self._toVerticalRotate90Animation,
                "toVerticalRotate270": self._toVerticalRotate270Animation,
                "toHorizontal": self._toHorizontalAnimation,
                "colorCorrection_0": self._colorAnimation,
                "noiseAnimation": self._noiseAnimation,
                "stabilizationAnimation": self._stabilizationAnimation,
                "greenscreenBackground": self._greenscreenBackgroundAnimation,
                "frame25": () => self.showFramePercent(25),
                "frame50": () => self.showFramePercent(50),
                "frame75": () => self.showFramePercent(75),
                "frame100": () => self.showFramePercent(100),
                "rotate90": self._videoRotate90,
                "rotate270": self._videoRotate270,
            },
            "image": {
                "none": self._imageShow,
                "crop2": self._imageCrop2,
                "colorCorrection_0": self._imageColorCorrection,
                "flipHorizontal": self._imageFlipHorizontal,
                "flipVertical": self._imageFlipVertical,
                "vectorizer": self._imageVectorizer,
                "upscale": self._imageUpscale,
                "toVertical": self._imageToVertical,
                "rotate90": self._imageRotate90,
                "rotate270": self._imageRotate270,
                "greenscreenBackground": self._imageGreenscreenBackground
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

    _drawVideoDuration() {
        this.ctx.fillStyle = "black";
        let filterSave = this.ctx.filter
        this.ctx.filter = ''
        let transformSave = this.ctx.getTransform()
        this.ctx.resetTransform()
        let saveAlpha = this.ctx.globalAlpha
        this.ctx.globalAlpha = 1

        let t = Math.floor(this.video.duration * 10) / 10;
        if (!t && t !== 0) return
        if (this.strategy === this._slowNextFrame)
            t *= 2

        if (this.animationName === 'fastMotion')
            t *= 0.5

        const cw = this.canvas.width,
            ch = this.canvas.height;
        const w = cw * 0.15,
            h = ch * 0.1

        this.ctx.fillRect(cw - w, 0, w, h)

        this.ctx.fillStyle = "white"
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '15px verdana';
        this.ctx.fillText(t + " s.", cw - w / 2, h / 2, w)

        this.ctx.filter = filterSave;
        this.ctx.setTransform(transformSave)
        this.ctx.globalAlpha = saveAlpha
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

                    if (owner.isDrawVideoDuration)
                        owner._drawVideoDuration()

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
        ctx.globalAlpha = 0.3
        this.video.playbackRate = 0.5
        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);
        ctx.drawImage(this.video, x, y, canvasScaledWidth, canvasScaledHeight);
    }

    _verticalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx, rotation = 0) {
        let height = Math.min(this.videoHeight, this.videoWidth / 9 * 16);
        let width = height * 9 / 16;

        let hRatio = this.canvas.width / width;
        let vRatio = this.canvas.height / height;
        let ratio = Math.min(hRatio, vRatio);

        let w = width * ratio
        let h = height * ratio
        let y = 0.5 * (this.canvas.height - h);
        let x = 0.5 * (this.canvas.width - w);

        const rot = rotation * Math.PI / 180
        if (rotation == 90 || rotation == 270) {
            ctx.setTransform(1, 0, 0, 1, this.canvas.width / 2, this.canvas.height / 2);
            ctx.rotate(rot);
            // Это если хочется сначала кроп, потом поворот кропнутого
            // ratio = Math.min(this.canvas.width / h, this.canvas.height / w);
            // ctx.drawImage(this.video, this.videoWidth / 2 - width / 2, 0, width, height, -y - w * ratio / 2, -h * ratio / 2, w * ratio, h * ratio);
            width = Math.min(this.videoWidth, this.videoHeight / 9 * 16);
            height = width * 9 / 16;
            hRatio = this.canvas.width / height;
            vRatio = this.canvas.height / width;
            ratio = Math.min(hRatio, vRatio);

            h = height * ratio
            w = width * ratio
            x = 0.5 * (this.canvas.height - h);
            y = 0.5 * (this.canvas.width - w);
            ctx.drawImage(this.video, this.videoWidth / 2 - width / 2, this.videoHeight / 2 - height / 2, width, height, -w / 2, -h / 2, w, h);
        }
        if (rotation == 0)
            ctx.drawImage(this.video, this.videoWidth / 2 - width / 2, this.videoHeight / 2 - height / 2, width, height, x, y, w, h);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    _horizontalCropNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let height = Math.min(this.videoHeight, this.videoWidth / 16 * 9);
        let width = height * 16 / 9;

        let hRatio = this.canvas.width / width;
        let vRatio = this.canvas.height / height;
        let ratio = Math.min(hRatio, vRatio);

        let w = width * ratio
        let h = height * ratio

        let y = 0.5 * (this.canvas.height - h);
        let x = 0.5 * (this.canvas.width - w);

        console.log(w, h)

        ctx.drawImage(this.video, this.videoWidth / 2 - width / 2, this.videoHeight / 2 - height / 2, this.videoWidth, height,
            x, y, w, h);
    }

    _crop2NextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let w = this.videoWidth / 2,
            h = this.videoHeight / 2;

        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);

        ctx.drawImage(this.video, w - w / 2, h - h / 2, w, h, x, y, canvasScaledWidth, canvasScaledHeight)
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

    _crop2Animation(self) {
        self.strategy = self._crop2NextFrame;
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

    _videoRotate90(self) {
        const rot = 90 * Math.PI / 180
        self.ctx.setTransform(1, 0, 0, 1, self.canvas.width / 2, self.canvas.height / 2);
        self.ctx.rotate(rot);
        self.strategy = self._rotatetedNextFrame;
    }

    _videoRotate270(self) {
        const rot = 270 * Math.PI / 180
        self.ctx.setTransform(1, 0, 0, 1, self.canvas.width / 2, self.canvas.height / 2);
        self.ctx.rotate(rot);
        self.strategy = self._rotatetedNextFrame;
    }

    _rotatetedNextFrame(canvasScaledWidth, canvasScaledHeight, ctx) {
        let height = this.videoHeight;
        let width = this.videoWidth;

        let hRatio = this.canvas.width / width;
        let vRatio = this.canvas.height / height;
        let ratio = Math.min(hRatio, vRatio);

        let w = width * ratio
        let h = height * ratio
        let y = 0.5 * (this.canvas.height - h);

        ratio = Math.min(this.canvas.width / h, this.canvas.height / w);
        ctx.drawImage(this.video, -y - w * ratio / 2, -h * ratio / 2, w * ratio, h * ratio);
    }

    _greenscreenBackgroundAnimation(self) {
        self.strategy = self._imageGreenscreenShowImage;
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

            owner.ctx.fillStyle = 'black'
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

    _drawFrameNumber(num) {
        this.ctx.fillStyle = "black";
        let w = this.canvas.width,
            h = this.canvas.height
        this.ctx.fillRect(w - w * 0.10, h - w * 0.10, w * 0.1, w * 0.1)
        this.ctx.fillStyle = "white"
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '30px verdana';
        this.ctx.fillText(num, w - w * 0.05, h - w * 0.05)
    }

    _get3FramesAnimation(self) {
        self.video.pause();

        function showPercentedFrame(percent) {
            self.showFramePercent(percent, false).then(_ => {
                self._drawFrameNumber(percent / 25)
            })
            let newPercent = percent + 25
            if (newPercent === 100) newPercent = 25
            self.timers.push(window.setTimeout((p) => showPercentedFrame(p), 600, newPercent))
        }

        self.showFramePercent(25).then(_ => {
            self._drawFrameNumber(1)
        })
        self.canvas.play = () => showPercentedFrame(25)

        self.strategy = self._defaultNextFrame;
    }

    _get4FramesAnimation(self) {
        self.video.pause();
        const percents = [10, 25, 50, 75]

        function showPercentedFrame(i) {
            self.showFramePercent(percents[i], false).then(_ => {
                self._drawFrameNumber(i + 1)
            })
            let nextI = i + 1
            if (nextI === percents.length) nextI = 0
            self.timers.push(window.setTimeout((p) => showPercentedFrame(p), 600, nextI))
        }

        self.showFramePercent(10).then(_ => {
            self._drawFrameNumber(1)
        })
        self.canvas.play = () => showPercentedFrame(0)

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

    _imageCrop2(self) {
        self.strategy = self._crop2ShowImage;
    }

    _crop2ShowImage(canvasScaledWidth, canvasScaledHeight, ctx) {
        let w = this.image.width / 2,
            h = this.image.height / 2;

        let y = 0.5 * (this.canvas.height - canvasScaledHeight);
        let x = 0.5 * (this.canvas.width - canvasScaledWidth);

        ctx.drawImage(this.image, w - w / 2, h - h / 2, w, h, x, y, canvasScaledWidth, canvasScaledHeight)
    }

    _imageToVertical(self) {
        self.strategy = self._toVerticalShowImage;
    }

    _toVerticalShowImage(canvasScaledWidth, canvasScaledHeight, ctx) {
        let height = Math.min(this.image.height, this.image.width / 9 * 16);
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

    _imageGreenscreenBackground(self) {
        self.strategy = self._imageGreenscreenShowImage;
    }

    _imageGreenscreenShowImage(canvasScaledWidth, canvasScaledHeight, ctx) {
        let width = greenscreen_image.width * ctx.canvas.height / greenscreen_image.height
        ctx.drawImage(greenscreen_image, ctx.canvas.width / 2 - width / 2, 0, width, ctx.canvas.height)
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