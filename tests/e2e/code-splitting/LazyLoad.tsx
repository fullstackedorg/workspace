class LazyLoad extends HTMLElement {
    connectedCallback(){
        this.innerText = "Lazy Loaded"
    }
}
customElements.define("lazy-loaded", LazyLoad)
