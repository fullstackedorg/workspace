import axios, {AxiosRequestConfig} from "axios";

export namespace fetch {
    function convertQueryObjectToString(query: any){
        if(!query)
            return "";

        return "?" + new URLSearchParams(query).toString();
    }

    export async function get<T extends keyof ENDPOINTS_GET | string>(
        url: T,
        query?: T extends keyof ENDPOINTS_GET ? ENDPOINTS_GET[T][1] : any,
        config?: AxiosRequestConfig)
        : Promise<T extends keyof ENDPOINTS_GET ? ENDPOINTS_GET[T][0] : any>
    {
        return (await axios.get(url + convertQueryObjectToString(query), config)).data;
    }

    export async function post<T extends keyof ENDPOINTS_POST | string>(
        url: T,
        ...args: (T extends keyof ENDPOINTS_POST ? [ENDPOINTS_POST[T][1], ENDPOINTS_POST[T][2]?, AxiosRequestConfig?] : [any?, any?, AxiosRequestConfig?])
    ): Promise<T extends keyof ENDPOINTS_POST ? ENDPOINTS_POST[T][0] : any>
    {
        let constructedURL: string = url;
        constructedURL += args[1] ? convertQueryObjectToString(args[1]) : ""
        return (await axios.post(constructedURL, args[0], args[2] ?? {})).data;
    }

    export async function put<T extends keyof ENDPOINTS_PUT | string>(
        url: T,
        ...args: (T extends keyof ENDPOINTS_PUT ? [ENDPOINTS_PUT[T][1], ENDPOINTS_PUT[T][2]?, AxiosRequestConfig?] : [any?, any?, AxiosRequestConfig?])
    ): Promise<T extends keyof ENDPOINTS_PUT ? ENDPOINTS_PUT[T][0] : any>
    {
        let constructedURL: string = url;
        constructedURL += args[1] ? convertQueryObjectToString(args[1]) : ""
        return (await axios.put(constructedURL, args[0], args[2] ?? {})).data;
    }

    export async function del<T extends keyof ENDPOINTS_DELETE | string>(
        url: T,
        query?: T extends keyof ENDPOINTS_GET ? ENDPOINTS_GET[T][1] : any,
        config?: AxiosRequestConfig)
        : Promise<T extends keyof ENDPOINTS_DELETE ? ENDPOINTS_DELETE[T][0] : any>
    {
        return (await axios.delete(url + convertQueryObjectToString(query), config)).data;
    }
}
