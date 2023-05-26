const minWidth = 500;
export const getWidth = () => {
    return window.innerWidth <= minWidth
        ? window.innerWidth
        : window.innerWidth > minWidth && window.innerWidth < (minWidth * 2)
            ? minWidth
            : window.innerWidth / 2;
}
