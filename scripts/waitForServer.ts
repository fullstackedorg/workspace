export default function (waitLimit: number, url: string = "http://localhost:8000", silent: boolean = false): Promise<void>{
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {

            const abortController = new AbortController()
            const timeoutId = setTimeout(() => abortController.abort(), 500)

            fetch(url, { signal: abortController.signal })
                .then(() => {
                    clearTimeout(timeoutId);
                    clearInterval(interval);
                    resolve();
                })
                .catch(() => {
                    if(Date.now() - startTime > waitLimit) {
                        if(!silent)
                            console.error("Max Wait Limit reached")
                        clearInterval(interval);
                        reject();
                    }
                })
                .finally(() => clearTimeout(timeoutId));

        }, 550);
    });
}
