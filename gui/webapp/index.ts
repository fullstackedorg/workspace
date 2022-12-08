import main from "./main";

const savedTheme = window.localStorage.getItem("theme");
if(savedTheme === "dark") document.body.classList.add("theme-dark");

main();
