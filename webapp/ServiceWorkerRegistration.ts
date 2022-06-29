(async () => {
    if (!('serviceWorker' in navigator) || window.location.protocol !== "https:")
        return;

    // compare version
    const currentVersion = process.env.VERSION;
    const lastVersion = window.localStorage.getItem("version");

    // if mismatch unregister old service worker
    if(currentVersion !== lastVersion){
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let i = 0; i < registrations.length; i++)
            await registrations[i].unregister();
    }

    // register service-worker
    await navigator.serviceWorker.register('/service-worker-entrypoint.js');

    window.localStorage.setItem("version", currentVersion);
})();
