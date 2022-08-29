document.body.innerHTML += `<fullstacked-element></fullstacked-element>`;

class FullStackedPNG extends HTMLElement{
    connectedCallback(){
        this.innerHTML = `<img src="${require("./logo.png")}" />`;
    }
}

customElements.define("fullstacked-element", FullStackedPNG);
