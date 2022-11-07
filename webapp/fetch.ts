import axios, {AxiosRequestConfig} from "axios";

export namespace fetch {
    function convertQueryObjectToString(query: any){
        if(!query)
            return "";

        return "?" + new URLSearchParams(query).toString();
    }

    export async function get(
        url: string,
        query?: {[key: string]: any},
        config?: AxiosRequestConfig)
        : Promise<any>
    {
        return (await axios.get(url + convertQueryObjectToString(query), config)).data;
    }

    export async function post(
        url: string,
        data?: any,
        query?: {[key: string]: any},
        config?: AxiosRequestConfig
    ): Promise<any>
    {
        let constructedURL: string = url;
        constructedURL += query ? convertQueryObjectToString(query) : ""
        return (await axios.post(constructedURL, data, config ?? {})).data;
    }

    export async function put(
        url: string,
        data?: any,
        query?: {[key: string]: any},
        config?: AxiosRequestConfig
    ): Promise<any>
    {
        let constructedURL: string = url;
        constructedURL += query ? convertQueryObjectToString(query) : ""
        return (await axios.put(constructedURL, data, config ?? {})).data;
    }

    export async function del(
        url: string,
        query?: {[key: string]: any},
        config?: AxiosRequestConfig)
        : Promise<any>
    {
        return (await axios.delete(url + convertQueryObjectToString(query), config)).data;
    }
}
