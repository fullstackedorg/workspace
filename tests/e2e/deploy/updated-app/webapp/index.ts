document.body.innerHTML += `<fullstacked-element></fullstacked-element>`;

class FullStacked2 extends HTMLElement{
    connectedCallback(){
        this.innerHTML = `<h1>Deploy Test 2</h1>
<div id="version">${process.env.VERSION}</div>`;
    }
}

customElements.define("fullstacked-element", FullStacked2);
