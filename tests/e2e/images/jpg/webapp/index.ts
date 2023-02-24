//@ts-ignore
import logo from "./logo.jpg"

document.body.innerHTML = `<fullstacked-element></fullstacked-element>`;

class FullStackedJPG extends HTMLElement{
    connectedCallback(){
        this.innerHTML = `<img src="${logo}" />`
    }
}

customElements.define("fullstacked-element", FullStackedJPG);
