//@ts-ignore
import logo from "./logo.png"

document.body.innerHTML = `<fullstacked-element></fullstacked-element>`;

class FullStackedPNG extends HTMLElement{
    connectedCallback(){
        this.innerHTML = `<img src="${logo}" />`;
    }
}

customElements.define("fullstacked-element", FullStackedPNG);
