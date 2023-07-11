import WinBox from "winbox/src/js/winbox";

const aimedWidth = 600;
export const getDefaultWidth = () => {
    return window.innerWidth <= aimedWidth
        ? window.innerWidth
        : aimedWidth
}

const ratio = 1.4;
export const getDefaultHeight = (width: number) => {
    const ratioHeight = width / ratio;
    return window.innerHeight <= ratioHeight
        ? window.innerHeight
        : ratioHeight;
}

const winBoxes = new Map<string, WinBox>;

const getSortedWinBoxes = () => Array.from(winBoxes.values())
    .sort((winBoxA, winBoxB) => {
        const zIndexA = parseInt(winBoxA.dom.style.zIndex);
        const zIndexB = parseInt(winBoxB.dom.style.zIndex);
        return zIndexA - zIndexB;
    });

export function createWindow(title, options: {
    mount: HTMLElement,
    onclose?(): void,
    onresize?(): void,
    onfullscreen?(): void
}){
    const width = getDefaultWidth();
    const height = getDefaultHeight(width);

    let x = window.innerWidth / 2 - width / 2;
    let y = window.innerHeight / 2 - height / 2;

    const topWinBox = getSortedWinBoxes().pop();

    if(topWinBox){
        const bb = topWinBox.dom.getBoundingClientRect();
        x = bb.x + 50;
        y = bb.y + 50;
    }

    if(x + width >= window.innerWidth)
        x = 0;

    if(y + height >= window.innerHeight)
        y = 0;

    const id = makeid(6);
    const winBox = new WinBox(title, {
        // overrideable
        width,
        height,
        x,
        y,

        ...options,

        // not overrideable
        onclose: () => {
            if(options.onclose)
                options.onclose();

            winBoxes.delete(id);
            return false;
        },
    });
    winBoxes.set(id, winBox);
    return { id, winBox }
}

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
    if(document.activeElement.tagName === "IFRAME")
        focusWindow(document.activeElement.id);
}

checkIfInIframe();

export function focusWindow(id: string){
    const winBox = winBoxes.get(id);
    if(winBox) winBox.focus()
}
