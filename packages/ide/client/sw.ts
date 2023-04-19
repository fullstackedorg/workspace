const isLocalHostOrIP = () => {
    return window.location.protocol !== "https:" // no certs
        || window.location.host.includes("localhost") // localhost
        || window.location.host.match(/\d+\.\d+\.\d+\.\d+/) // IP address

}

if ('serviceWorker' in navigator) {
    if (!isLocalHostOrIP()) {
        await navigator.serviceWorker.register('/service-worker.js');
    } else {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let i = 0; i < registrations.length; i++)
            await registrations[i].unregister();
    }
}

export {}
