import type WinBox from "winbox/src/js/winbox";

const minWidth = 500;
export const getWidth = () => {
    return window.innerWidth <= minWidth
        ? window.innerWidth
        : window.innerWidth > minWidth && window.innerWidth < (minWidth * 2)
            ? minWidth
            : window.innerWidth / 2;
}

export const iframeWinBoxes = new Map<string, WinBox>;

export function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

function checkIfInIframe(){
    window.requestAnimationFrame(checkIfInIframe);
    if(document.activeElement.tagName === "IFRAME"){
        const id = document.activeElement.id;
        const winBox = iframeWinBoxes.get(id);
        if(winBox)
            winBox.focus();
    }
}

checkIfInIframe();
