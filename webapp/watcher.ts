setInterval(() => {
    fetch("/dev").then(res => res.json()).then(timestamp => {
        const lastBuildTimeStr = window.localStorage.getItem("buildTime")
        if(!lastBuildTimeStr)
            return window.localStorage.setItem("buildTime", timestamp.toString());

        const lastBuildTime = Number(lastBuildTimeStr);
        if(lastBuildTime < timestamp) {
            window.localStorage.setItem("buildTime", timestamp.toString());
            window.location.reload();
        }
    });
}, 1000);
