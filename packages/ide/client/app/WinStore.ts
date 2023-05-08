export const createWinID = () => Math.floor(Math.random() * 1000000).toString();

export const winStore = new Map<string, any>();

window.addEventListener('message', e => {
    const winBox = winStore.get(e.data.winID);
    if(winBox) winBox.focus();
})

const minWidth = 500;
export const getWidth = () => {
    return window.innerWidth <= minWidth
        ? window.innerWidth
        : window.innerWidth > minWidth && window.innerWidth < (minWidth * 2)
            ? minWidth
            : window.innerWidth / 2;
}
