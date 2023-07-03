declare global {
    interface Window {
        hasCredentialless: boolean
    }
}

function setCookie(cname, cvalue, seconds) {
    const d = new Date();
    d.setTime(d.getTime() + (seconds * 1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export default function () {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `
        visibility: hidden;
        top:0;
        left:0;
        position: fixed;
    `;

    document.body.append(iframe);

    const url = new URL(window.location.href);
    url.searchParams.set("test", "credentialless");
    setCookie("test", "credentialless", 60);

    return new Promise<void>(resolve => {
        const analyzeIframeResponse = (e) => {
            if(typeof e.data.credentialless !== 'boolean') return;
            window.hasCredentialless = e.data.credentialless;
            window.removeEventListener('message', analyzeIframeResponse);
            iframe.remove();
            resolve();
        }

        window.addEventListener('message', analyzeIframeResponse);

        // @ts-ignore
        iframe.credentialless = true;
        iframe.src = url.toString();
    });
}
