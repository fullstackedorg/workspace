import { useState } from "react";

function useAPI<T extends (...args: Parameters<T>) => Promise<any>, R = Awaited<ReturnType<T>>>(method: T, ...args: Parameters<T>) : [R, () => void] {
    const [data, setData] = useState<ReturnType<T>>(null);

    const fetchData = () => { method(...args).then((data) => setData(data)) }

    if(!data)
        fetchData()

    return [data as R, fetchData];
}

export default useAPI;
