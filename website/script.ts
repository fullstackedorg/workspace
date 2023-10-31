
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