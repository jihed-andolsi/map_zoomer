/**
 * Created by Andolsi on 02/04/2018.
 */
export let scaleToWindow = (width, height) => {
    /*let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let size = [1366, 740];
    let ratio = size[0] / size[1];
    let w = windowWidth;
    let h = windowHeight;
    if (windowWidth / windowHeight >= ratio) {
        w = windowHeight * ratio;
        h = windowHeight;
    } else {
        w = windowWidth;
        h = window.innerWidth / ratio;
    }
    return {w, h, ratio};*/

    const appWidth = 960;
    const appHeight = 540;
    const appOrientation = appWidth > appHeight ? 'landscape' : 'portrait';
    const appLandscapeScreenRatio = appWidth / appHeight;
    const appPortraitScreenRatio = appHeight / appWidth;

    const isScreenPortrait = window.innerHeight >= window.innerWidth;
    const isScreenLandscape = !isScreenPortrait;
    const screenRatio = window.innerWidth / window.innerHeight;

    let newWidth;
    let newHeight;

    if ( (appOrientation === 'landscape' && isScreenLandscape) || (appOrientation === 'portrait' && isScreenPortrait) ) {
        if ( screenRatio < appLandscapeScreenRatio ) {
            newWidth = appWidth;
            newHeight = Math.round( appWidth / screenRatio );
        } else {
            newWidth = Math.round( appHeight * screenRatio );
            newHeight = appHeight;
        }
    } else {
        if ( screenRatio < appPortraitScreenRatio ) {
            newWidth = appHeight;
            newHeight = Math.round( appHeight / screenRatio );
        } else {
            newWidth = Math.round( appWidth * screenRatio );
            newHeight = appWidth;
        }
    }

    return {newWidth, newHeight, appWidth, appHeight};

}