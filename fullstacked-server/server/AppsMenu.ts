import Cookies from 'js-cookie'

const button = document.createElement("button");
button.innerText = "Dashboard";
button.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    z-index: 9999;
`
button.addEventListener("click", () => {
    if(Cookies.get("app"))
        Cookies.remove("app");
    else
        Cookies.set("app", "test");

    window.location.reload();
})

window.onload = function (){
    document.body.append(button);
}
