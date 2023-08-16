//@ts-ignore
import loading from "../icons/loading.gif";

export function openCodeOSS(folder?: string){
    const iframe = document.createElement("iframe");
    iframe.style.backgroundImage = `url(${loading})`;
    // const {id} = createWindow("Code OSS", {mount: iframe});
    // iframe.setAttribute("id", id);
    const url = new URL(`${window.location.protocol}//8888.${window.location.host}`);
    if(folder)
        url.search = `?folder=${folder}`
    iframe.src = url.toString();
}
