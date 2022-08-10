class FullStackedRun extends HTMLElement{
    connectedCallback(){
        this.innerHTML = "Run Test";
    }
}

customElements.define("fullstacked-element", FullStackedRun);
