import React from 'React';
import webapp from "WebApp";

(async () => {
    const lazyLoad = await import("./LazyLoad");
    webapp(lazyLoad.default());
})()
