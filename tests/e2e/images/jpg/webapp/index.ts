document.body.innerHTML += `<fullstacked-element></fullstacked-element>`;

class FullStackedJPG extends HTMLElement{
    connectedCallback(){
        this.innerHTML = `<img src="${require("./logo.jpg")}" />`
    }
}

customElements.define("fullstacked-element", FullStackedJPG);
