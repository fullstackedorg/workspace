class WebComponent extends HTMLElement{
    async connectedCallback(){
        this.innerText = "Web Component";
    }
}

customElements.define("web-component", WebComponent);

document.body.append(new WebComponent());
