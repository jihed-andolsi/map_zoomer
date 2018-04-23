import * as PIXI from "pixi.js";

class LoaderText extends PIXI.Text {
    constructor(width, height) {
        super("Loading 0%", {
            fill: "#555555",
            fontsize: "48px",
            fontfamily: "Arial",
            wordWrap: true,
            wordWrapWidth: 700,
        });
        (this as any).anchor = new PIXI.Point(0.5, 0.5);
        (this as any).x = width / 2;
        (this as any).y = height / 2;
    }
}

export default LoaderText;
