document.body.innerHTML += `<div id="root"><lazy-loaded></lazy-loaded></div>`;

(async () => {
    await import("./LazyLoad");
})()
