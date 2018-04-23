/**
 * Created by Andolsi on 04/04/2018.
 */
export let deviceDetect = require('device-detect')();
export let isMobile = () => {
    const mobileListDevices = ['iPhone', 'iPad', 'iPod', 'Blackberry', 'WindowsMobile', 'Android'];
    let deviceDetectValue = deviceDetect.device;
    let list = mobileListDevices.filter((e) => e == deviceDetectValue);
    if(list.length){
        return true;
    }
    return false;
}