class FullStackedSVG extends HTMLElement{
    connectedCallback(){
        this.innerHTML = `<img src="${require("./logo.svg")}" />`
    }
}

customElements.define("fullstacked-element", FullStackedSVG);
