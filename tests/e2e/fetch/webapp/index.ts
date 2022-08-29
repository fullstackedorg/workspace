import {fetch} from "fullstacked/webapp/fetch";

document.body.innerHTML += `<fullstacked-element></fullstacked-element>`;

class FullStackedFetch extends HTMLElement{
    connectedCallback(){
        this.testFetch()
    }

    async testFetch(){
        try{
            await fetch.post("/api/test");
            await fetch.put("/api/test");
            await fetch.del("/api/test");
        }catch (e) {
            return;
        }
        this.innerText = await fetch.get("/api/test");
    }
}

customElements.define("fullstacked-element", FullStackedFetch);
