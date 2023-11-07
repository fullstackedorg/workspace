
const map = document.querySelector("#map");
const zoom = document.querySelector<HTMLDivElement>("#zoom");
const zoomBB = zoom.getBoundingClientRect();
const highResImage = zoom.querySelector<HTMLImageElement>(":scope > img");
const scaleFactor = 2;
map.addEventListener("mousemove", (e:MouseEvent) => {
    const smallImageBB = map.querySelector(":scope > img").getBoundingClientRect();
    const [x, y] = [e.clientX - smallImageBB.x, e.clientY - smallImageBB.y];

    if(x > smallImageBB.width || y > smallImageBB.height){
        return;
    }

    const ratioX = x / smallImageBB.width ;
    const ratioY = y / smallImageBB.height;

    zoom.style.transform = `translate(${ratioX * smallImageBB.width - zoomBB.width/2}px, ${ratioY * smallImageBB.height - zoomBB.height/2}px)`;

    const width = smallImageBB.width * scaleFactor;
    const height = smallImageBB.height * scaleFactor;
    highResImage.style.width = width + "px";
    highResImage.style.height = height + "px";
    const transform = `translate(${-ratioX * smallImageBB.width * scaleFactor + zoomBB.width/2}px, ${-ratioY * smallImageBB.height * scaleFactor + zoomBB.height/2}px)`;
    highResImage.style.transform = transform;
});


if(window.navigator.userAgent.toLocaleLowerCase().includes("windows")){
    const style = document.createElement("style");
    style.innerText = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap');
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #00000010;
      }
      ::-webkit-scrollbar-thumb {
        background: #00000040;
        border-radius: 30px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #00000070;
      }`;
    document.head.append(style);
}

const successIconFromDOM = document.querySelector("#success-icon");
const successIcon = successIconFromDOM.cloneNode(true) as HTMLElement;
successIconFromDOM.remove();
successIcon.style.display = "inline-block";


document.querySelectorAll(".copy").forEach(element => {
    const text = element.querySelector("span").innerText;

    element.addEventListener("click", () => {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.opacity = "0";
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";

      
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.blur();
        textArea.remove();

        const icon = element.querySelector("svg");
        const originalIcon = icon.cloneNode(true);
        const successIconClone = successIcon.cloneNode(true);
        element.replaceChild(successIconClone, icon);
        setTimeout(() => {element.replaceChild(originalIcon, successIconClone)}, 2000);
    })
});

const header = document.querySelector("header")
document.querySelector("#menu-icon").addEventListener("click", () => {
    header.classList.toggle("open");
})