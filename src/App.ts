require("./Assets/css/_custom.scss");
require("./Assets/css/main.css");
let $ = (window as any).$;
import * as PIXI from "pixi.js";
let tweenManager = require("pixi-tween");
import * as d3 from "d3";
import Button from "./Tools/Button";
import LoaderText from "./Tools/LoaderText";
import {isMobile} from "./Tools/DeviceDetect";



class Zoomer extends PIXI.Application {
    private Customloader = new PIXI.loaders.Loader();
    private Container = new PIXI.Container();
    private ContainerButtons = new PIXI.Container();
    private ContainerGuide = new PIXI.Container();
    private containerProjectItems = new PIXI.Container();
    private filterBackground = new PIXI.filters.ColorMatrixFilter();
    private width: number;
    private height: number;
    private widthExtent: number;
    private heightExtent: number;
    private widthExtentMaximum: number;
    private heightExtentMaximum: number;
    private selector;
    private newGraphic = [];
    private _counterGraphic: number = 0;
    private newGraphicObj = [];
    private zoomTrans = {x: 0, y: 0, k: .1};
    private startDrawing: boolean = false;
    private sprites: object = {};
    private view;
    private stage;
    private zoomHandler;
    private Graphics = [];
    private Buttons = [];
    private canvas = null;
    private context = null;
    private widthCanvas = null;
    private heightCanvas = null;
    private D3Interval = null;
    private isMobile: boolean = false;
    private PowredByText = null;
    private isZooming: boolean = false;
    private options: object = [];
    private locations/*: object[]*/ = [];
    private locationsAlpha = .5;
    private locationsMakeAlphaBigger: boolean = true;


    constructor(width, height, options) {
        super(width, height, options);

    }
    public init(options, callback){
        this.options = options;
        let [width, height] = (this.options as any).size;
        if (isMobile()) {
            [width, height] = (this.options as any).sizePhone;
            if (width > height) {
                [width, height] = [height, width];
            }
        }
        (this.options as any).width = width;
        (this.options as any).height = height;
        this.Container.zIndex = 0;
        // this.Container.anchor = new PIXI.Point(0.5, 0.5);

        this.ContainerButtons.zIndex = 1;
        this.ContainerGuide.zIndex = 2;
        this.width = (this.options as any).width;
        this.height = (this.options as any).height;
        /*if (isMobile() || (this.options as any).fullSizeShow) {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        }*/
        this.widthExtentMaximum = (this.options as any).widthExtentMaximum(this.width);
        this.heightExtentMaximum = (this.options as any).heightExtentMaximum(this.height);
        this.widthExtent = (this.options as any).widthExtent(this.width);
        this.heightExtent = (this.options as any).heightExtent(this.height);
        this.selector = (this.options as any).selectorId;
        this.isMobile = isMobile();
        this.appendView();
        this.setup(callback);
    }
    private appendView() {
        const $this = this;
        document.getElementById($this.selector).appendChild($this.view);
    }

    private setup(callback) {
        const $this = this;
        const s = {};
        const text = new LoaderText(($this as any).width, ($this as any).height);

        $this.stage.addChild(text);

        $this.stage.addChild($this.Container);
        (this.options as any).sprites.forEach((e) => {
            $this.Customloader.add(e.name, e.url);
        });

        $this.Customloader.load((loader, resources) => {
            Object.keys(resources).map((e) => {
                this.sprites[e] = new PIXI.Sprite(resources[e].texture);
            });
        });
        ($this as any).Customloader.onProgress.add((e) => {
            let prog = parseInt(e.progress);
            (text as any).text = `Loading ${prog}%`;
        }); // called once per loaded/errored file
        // $this.Customloader.onError.add(() => { }); // called once per errored file
        // $this.Customloader.onLoad.add(() => { }); // called once per loaded file
        $this.Customloader.onComplete.add((e) => {
            $this.stage.removeChild(text);
            $this.addBackground();
            $this.addGuide();
            $this.addLocations();
            $this.addProject();
            $this.addProjectItem();
            $this.addButtons();
            $this.addPowredBy();
            $this.initZoomAction();
            $this.resizeCanvas();
            $this.addTicker();
            callback();
        });
    }
    private addBackground() {
        const $this = this;
        if (($this.sprites as any).background.interactive) {
            $this.Container.removeChild(($this.sprites as any).background)
        }
        ($this.sprites as any).background.x = 0;
        ($this.sprites as any).background.y = 0;
        // ($this.sprites as any).background.anchor = new PIXI.Point(0.5, 0.5);
        ($this.sprites as any).background.interactive = true;
        ($this.sprites as any).background.filters = [this.filterBackground];


        // const filter = new filters.ColorMatrixFilter();
        //$this.removeColorFromSprite(($this.sprites as any).background);
        ($this.sprites as any).background.on("pointerdown", (e) => {
            const x = e.data.global.x;
            const y = e.data.global.y;
            // console.log(`Point {${x}, ${y}}`);
            if ($this.startDrawing) {
                const xD3 = $this.getD3X(x);
                const yD3 = $this.getD3Y(y);
                $this.newGraphic.push([xD3, yD3]);

                console.dir($this.newGraphic);

                $this.Container.removeChild($this.newGraphicObj[$this._counterGraphic]);
                $this.newGraphicObj[$this._counterGraphic] = $this.createGraph($this.newGraphic);
                $this.Container.addChild($this.newGraphicObj[$this._counterGraphic]);
            }
        });

        ($this.sprites as any).background.mouseover = function () {
            $this.addColorToBackground();
            return ($this.options as any).onMouseOverBackground(location);
        };
        ($this.sprites as any).background.mouseout = function() {
            return ($this.options as any).onMouseOutBackground(location);
        };
        /*($this.sprites as any).background.mousemove = function () {
            $this.addColorToBackground();
            return ($this.options as any).onMouseMoveBackground(location);
        };*/
        $this.Container.addChild(($this.sprites as any).background);
    }

    private addGuide(){
        const $this = this;
        if($this.options.hasOwnProperty('showGuide')){
            if(($this.options as any).showGuide){
                ($this.sprites as any).guide.x = $this.width/2;
                ($this.sprites as any).guide.y = $this.height / 2;
                ($this.sprites as any).guide.anchor = new PIXI.Point(0.5, 0.5);
                ($this.sprites as any).guide.interactive = true;
                ($this.sprites as any).guide.filters = [this.filterBackground];
                ($this.sprites as any).guide.on("pointerdown", (e) => {
                    // $this.ContainerGuide.removeChild(($this.sprites as any).guide);
                    $this.ContainerGuide.destroy({children:true})
                });

                ($this.sprites as any).guide.mouseover = function () {

                };
                ($this.sprites as any).guide.mouseout = function() {
                    return ($this.options as any).onMouseOutBackground(location);
                };
                /*($this.sprites as any).background.mousemove = function () {
                    $this.addColorToBackground();
                    return ($this.options as any).onMouseMoveBackground(location);
                };*/
                $this.stage.addChild($this.ContainerGuide);
                $this.ContainerGuide.addChild(($this.sprites as any).guide);
            }
        }

    }

    private addLocations(){
        let $this = this;
        (this.options as any).locations.map((e) => {
            this.drawLocation(e);
            // let [x, y] = e.point;
            // $this.drawCircle(x, y);
        });
    }
    private addProject(){
        const $this = this;
        let project = (this.options as any).project;
        let graph = this.createGraph(project.coords);
        if(graph){
            graph.interactive = true;
            graph.mouseover = function () {
                $this.removeColorFromBackground();
                graph.alpha = .9;
                return ($this.options as any).onMouseOverPoject(project);
            };
            graph.mouseout = function() {
                $this.addColorToBackground();
                graph.alpha = .7;
                return ($this.options as any).onMouseOutProject(project);
            };
            this.Container.addChild(graph);
        }

    }
    private addProjectItem(){
        const $this = this;
        const options = (this.options as any);
        const sprites = ($this.sprites as any);
        if(options.hasOwnProperty("projectItems")){
            const projectItems = options.projectItems;
            if(projectItems.length){
                projectItems.map((element) => {
                    const picture = element.sprite;
                    const coords = element.coords;
                    const rotation = element.hasOwnProperty("rotation") ? element.rotation : 0;
                    if(sprites.hasOwnProperty(picture)){
                        const sprite = ($this.sprites as any)[picture];
                        sprite.interactive = true;
                        sprite.x = coords.x;
                        sprite.y = coords.y;
                        sprite.alpha = 1;
                        sprite.anchor = new PIXI.Point(0.5, 0.5);
                        (rotation) ? sprite.rotation = rotation : false;
                        sprite.mouseover = function () {
                            $this.removeColorFromBackground();
                            sprite.alpha = 1;
                            return ($this.options as any).onMouseOverPojectItem(element);
                        };
                        sprite.mouseout = function() {
                            $this.addColorToBackground();
                            sprite.alpha = 1;
                            return ($this.options as any).onMouseOutProjectItem(element);
                        };
                        $this.containerProjectItems.addChild(sprite);

                    }
                })
            }
        }
        $this.Container.addChild($this.containerProjectItems);
    }

    private drawLocation(location){
        const $this = this;
        let ContainerLocation = new PIXI.Container();
        let {x, y} = location.point;
        let y_difference = 30;
        const locationPoint = new PIXI.Graphics();
        locationPoint.lineStyle(2, 0xd1a9a4);
        locationPoint.beginFill(0xd1a9a4, 1);
        locationPoint.drawCircle(x, -y_difference, 5);
        locationPoint.endFill();
        locationPoint.interactive = true;
        locationPoint.buttonMode = true;

        const locationBigPoint = new PIXI.Graphics();
        locationBigPoint.lineStyle(0, 0xffffff, .7);
        locationBigPoint.beginFill(0xffffff, .7);
        locationBigPoint.drawCircle(x, -y_difference, 18);
        locationBigPoint.endFill();
        locationBigPoint.interactive = true;
        locationBigPoint.alpha = .5;
        locationBigPoint.buttonMode = true;
        let style = new PIXI.TextStyle({
            fontFamily: "Arial", // Font Family
            fontSize: 14, // Font Size
            // fontStyle: "italic",// Font Style
            // fontWeight: "bold", // Font Weight
            fill: ["#ffffff"/*, "#F8A9F9"*/], // gradient
            // stroke: "#ffffff",
            // strokeThickness: 5,
            // dropShadow: true,
            // dropShadowColor: "#000000",
            // dropShadowBlur: 4,
            // dropShadowAngle: Math.PI / 6,
            // dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 200,
            align : 'center'
        });
        let text = new PIXI.Text(location.name, "arial");
        text.anchor = new PIXI.Point(0.5, 0.5);
        text.x = x + location.position.x;
        text.y = -y_difference;
        let y_text = y + location.position.y;
        text.style = style;

        text.interactive = true;
        text.buttonMode = true;
        /*

        locationBigPoint.mouseover = function () {
            $this.removeColorFromBackground();
            return ($this.options as any).onMouseOverLocation(location);
        }
        locationBigPoint.mouseout = function () {
            return ($this.options as any).onMouseOutLocation(location);
        }*/

        ContainerLocation.addChild(locationBigPoint);
        ContainerLocation.addChild(locationPoint);
        ContainerLocation.addChild(text);
        ContainerLocation.interactive = true;
        ContainerLocation.mouseover = function () {
            $this.removeColorFromBackground();
            return ($this.options as any).onMouseOverLocation(location);
        }
        ContainerLocation.mouseout = function () {
            return ($this.options as any).onMouseOutLocation(location);
        }

        $this.Container.addChild(ContainerLocation);

        $this.locations.push([locationBigPoint, locationPoint, text, ContainerLocation]);
        this.tweenLocations(locationBigPoint, {y: -y_difference }, {y: y+y_difference});
        this.tweenLocations(locationPoint, {y: -y_difference }, {y: y+y_difference});
        this.tweenLocations(text, { y: -y_difference },{ y: y_text });
    }
    private tweenLocations(obj, pointFrom, pointTo){
        const tween = PIXI.tweenManager.createTween(obj);
        tween.from(pointFrom).to(pointTo)
        tween.time = 500;
        // tween.repeat = 10;
        tween.on('start', () => { /*.log('tween started')*/ });
        // tween.on('repeat', ( loopCount ) => { console.log('loopCount: ' + loopCount) });
        tween.start();
    }
    private addPowredBy() {
        const $this = this;
        let style = new PIXI.TextStyle({
            fontFamily: "Arial", // Font Family
            fontSize: 14, // Font Size
            // fontStyle: "italic",// Font Style
            fontWeight: "bold", // Font Weight
            fill: ["#646565"], // gradient
            // stroke: "#ffffff",
            // strokeThickness: 5,
            // dropShadow: true,
            // dropShadowColor: "#000000",
            // dropShadowBlur: 4,
            // dropShadowAngle: Math.PI / 6,
            // dropShadowDistance: 6,
            // wordWrap: true,
            // wordWrapWidth: 440
        });

        $this.PowredByText = new PIXI.Text("Powred by ConceptLab", "arial");
        $this.PowredByText.anchor = new PIXI.Point(0.5, 0.5);
        $this.PowredByText.x = $this.width - 200;
        $this.PowredByText.y = $this.height - 50;
        $this.PowredByText.style = style;
        $this.ContainerButtons.addChild(this.PowredByText);
    }

    private initZoomAction() {
        const $this = this;
        $this.canvas = d3.select(`#${$this.selector} canvas`);
        $this.context = $this.canvas.node().getContext("2d");
        $this.widthCanvas = $this.canvas.property("width");
        $this.heightCanvas = $this.canvas.property("height");

        $this.zoomHandler = d3.zoom()
            .scaleExtent([.7, 3])
            .translateExtent([[$this.widthExtent, $this.heightExtent], [$this.widthExtentMaximum, $this.heightExtentMaximum]])
            .on("start", () => {
                return $this.startZoomActions($this);
            })
            .on("zoom", () => {
                return $this.zoomActions($this);
            })
            .on("end", () => {
                return $this.endZoomActions($this);
            })
            .filter(() => {
                return !$this.D3Interval;
            });
        $this.initZommActionFunctionalities();
    }

    private initZommActionFunctionalities() {
        const $this = this;
        let data = {k:1, x: 0, y:0};
        if ((this.options as any).hasOwnProperty("initialData")) {
            data = (this.options as any).initialData($this.width, $this.height);
        }
        if (isMobile()) {
            data = (this.options as any).initialDataMobile($this.width, $this.height);
        }
        // initX = $this.width - $this.background.width
        $this.canvas.call($this.zoomHandler).call($this.zoomHandler.transform, d3.zoomIdentity.translate(data.x, data.y).scale(data.k));
        $this.canvas.on("click", () => {
            // const x = (d3.event.x - $this.zoomTrans.x) / $this.zoomTrans.k;
            // const y = (d3.event.y - $this.zoomTrans.y) / $this.zoomTrans.k;
        });
    }

    private zoomActions($this) {
        const x = d3.event.transform.x;
        const y = d3.event.transform.y;
        const k = d3.event.transform.k;
        $this.zoomTrans = d3.event.transform;
        // console.dir($this.zoomTrans);

        // console.dir(d3.event.transform);
        // let translate = "translate(" + d3.event.translate + ")";
        // let scale = "scale(" + d3.event.scale + ")";
        // $this.canvas.attr("transform", translate + scale);
        $this.Container.scale.set(k);
        $this.Container.position.set(x, y);

        // ($this.sprites as any).background.x = x;
        // ($this.sprites as any).background.y = y;

    }

    private startZoomActions($this) {
        $this.isZooming = true;
    }

    private endZoomActions($this) {
        $this.isZooming = false;
    }


    /*private drawCircle(x, y) {
        const $this = this;
        const c = new PIXI.Graphics();
        c.lineStyle(2, 0xFF00FF);
        c.drawCircle(x, y, 5);
        c.endFill();
        $this.Container.addChild(c);
        $this.Circls.push(c);
    }*/

    private addButtons() {
        const $this = this;
        if ($this.Buttons.length) {
            $this.Buttons.map((e) => {
                $this.ContainerButtons.removeChild(e);
            })
            $this.Buttons = [];
        }
        let width = 150;
        let height = 50;
        let x = 10;
        let y = ($this as any).height - height - 20;
        let txt = "Start drawing";
        if ($this.startDrawing) {
            let txt = "Stop drawing";
        }
        const b = new Button(width, height, x, y, txt, null);
        $this.stage.addChild($this.ContainerButtons);
        //b.buttonMode = true;
        (b as any).on("click", () => {
            $this.startDrawing = !$this.startDrawing;
            if (!$this.startDrawing) {
                (b as any).text.text = "Start drawing";
                $this._counterGraphic++;
                if ($this.newGraphic.length) {
                    $('#property #coords').html(JSON.stringify($this.newGraphic));
                    $("#property").modal({show: true});
                }
                $this.newGraphic = [];

            } else {
                (b as any).text.text = "Stop drawing";
            }
        });
        $this.Buttons.push(b);
        width = 250;
        height = 50;
        x = 170;
        y = ($this as any).height - height - 20;
        const returnLastActionB = new Button(width, height, x, y, "Return to last action", null);
        //returnLastActionB.buttonMode = true;
        (returnLastActionB as any).on("click", () => {
            if ($this.newGraphic.length) {
                $this.newGraphic.splice(-1, 1);
                $this.Container.removeChild($this.newGraphicObj[$this._counterGraphic]);
                $this.newGraphicObj[$this._counterGraphic] = $this.createGraph($this.newGraphic);
                if ($this.newGraphicObj[$this._counterGraphic]) {
                    $this.Container.addChild($this.newGraphicObj[$this._counterGraphic]);
                }
            }
        });
        $this.Buttons.push(returnLastActionB);
        if ((this.options as any).hasOwnProperty('showButtonPlans')) {
            if ((this.options as any).showButtonPlans) {
                $this.ContainerButtons.addChild(b);
                $this.ContainerButtons.addChild(returnLastActionB);
            }
        }
    }

    private createGraph(coords, graphInfo = {}) {
        if (coords) {
            if (coords.length) {
                let color = 0xc10000;
                let opacity = .5;
                if ((this.options as any).hasOwnProperty('defaultColor')) {
                    if ((this.options as any).defaultColor) {
                        color = (this.options as any).defaultColor;
                    }
                }
                if ((this.options as any).hasOwnProperty('defaultOpacity')) {
                    if ((this.options as any).defaultOpacity) {
                        opacity = (this.options as any).defaultOpacity;
                    }
                }
                if ((graphInfo as any).hasOwnProperty('info')) {
                    if ((graphInfo as any).info.landUse) {
                        if ((graphInfo as any).info.landUse.color) {
                            color = (graphInfo as any).info.landUse.color;
                            color = (color as any).replace(/#/gi, "0x");
                        }
                    }
                }
                const newGraphicObj = new PIXI.Graphics();
                newGraphicObj.beginFill(color, opacity);
                newGraphicObj.lineStyle(2, 0xffffff, opacity);
                let firstCoord = [];
                coords.map((e) => {
                    const [x, y] = e;
                    if (!firstCoord.length) {
                        firstCoord = e;
                        newGraphicObj.moveTo(x, y);
                    } else {
                        newGraphicObj.lineTo(x, e[1]);
                    }
                });
                if (firstCoord) {
                    const [firstX, firstY] = firstCoord;
                    newGraphicObj.lineTo(firstX, firstY);
                    newGraphicObj.endFill();
                }
                return newGraphicObj;
            }
        }
        return false;
    }

    public getD3X(x: number) {
        const $this = this;
        return (x - $this.zoomTrans.x) / $this.zoomTrans.k;
    }

    public getD3Y(y: number) {
        const $this = this;
        return (y - $this.zoomTrans.y) / $this.zoomTrans.k;
    }

    public resizeCanvas() {
        const $this = this;
        $this.rendererResize($this);
        window.addEventListener('resize', () => {
            return $this.rendererResize($this);
        });
        window.addEventListener('deviceOrientation', () => {
            return $this.rendererResize($this);
        });
    };

    private addTicker(){
        let $this = this;
        // Listen for animate update
        ($this as any).ticker.add(function(delta) {
            // console.log(delta);
            // just for fun, let's rotate mr rabbit a little
            // delta is 1 if running at 100% performance
            // creates frame-independent transformation
            // bunny.rotation += 0.1 * delta;
            let alphaTick = .01;
            if($this.locationsAlpha + alphaTick > 1){
                $this.locationsMakeAlphaBigger = false;
            }
            if($this.locationsAlpha - alphaTick < .2){
                $this.locationsMakeAlphaBigger = true;
            }
            if($this.locationsMakeAlphaBigger){
                $this.locationsAlpha += alphaTick;
            } else {
                $this.locationsAlpha -= alphaTick;
            }
            let alpha = $this.locationsAlpha;
            $this.locations.map((e) => {
                let [locationBigPoint, locationPoint] = e;
                locationBigPoint.alpha = alpha;
            });
            PIXI.tweenManager.update();

        });
    }

    public rendererResize($this) {
        if (isMobile() || ($this.options as any).fullSizeShow) {
            $this.width = window.innerWidth;
            $this.height = window.innerHeight;
        }
        let ratio = Math.min(window.innerWidth / $this.width,
            window.innerHeight / $this.height);
        if (ratio > 1) {
            ratio = 1;
        }
        $this.Container.scale.x = ratio;
        $this.Container.scale.y = ratio;
        $this.ContainerButtons.scale.x = ratio;
        $this.ContainerButtons.scale.y = ratio;
        $this.ContainerGuide.scale.x= ratio;
        $this.ContainerGuide.scale.y = ratio;
        // ($this.sprites as any).searchIcon.x = ($this as any).width - 150;
        // ($this.sprites as any).searchIcon.y = 50;
        // ($this.sprites as any).fulscreenIcon.x = ($this as any).width - 150;
        // ($this.sprites as any).fulscreenIcon.y = ($this as any).height - 150;
        $this.addButtons();
        $this.PowredByText.x = $this.width - 200;
        $this.PowredByText.y = $this.height - 50;
        // Update the renderer dimensions
        let width = Math.ceil($this.width * ratio);
        let height = Math.ceil($this.height * ratio);
        $this.renderer.resize(width, height);
        $this.canvas.call($this.zoomHandler).call($this.zoomHandler.transform, d3.zoomIdentity.translate($this.zoomTrans.x, $this.zoomTrans.y).scale($this.zoomTrans.k));

    };

    private removeColorFromBackground() {
        const $this = this;
        $this.removeColorFromSprite(($this.sprites as any).background);
    }

    private addColorToBackground() {
        const $this = this;
        $this.removeFiltersFromSprite(($this.sprites as any).background);
    }

    private removeColorFromSprite(sprite) {
        this.filterBackground.desaturate();
    }

    private removeFiltersFromSprite(sprite) {
        this.filterBackground.reset();
    }
}

export {
    Zoomer
}