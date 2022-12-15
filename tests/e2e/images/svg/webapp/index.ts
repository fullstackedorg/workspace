//@ts-ignore
import logo from "./logo.svg"

document.body.innerHTML += `<fullstacked-element></fullstacked-element>`;

class FullStackedSVG extends HTMLElement{
    connectedCallback(){
        this.innerHTML = `<img src="${logo}" />`
    }
}

customElements.define("fullstacked-element", FullStackedSVG);
