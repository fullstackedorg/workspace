import axios, {AxiosRequestConfig} from "axios";

export namespace fetch {
    export async function get<T extends keyof ENDPOINTS_GET | string>(
        url: T,
        config?: AxiosRequestConfig)
        : Promise<T extends keyof ENDPOINTS_GET ? ENDPOINTS_GET[T][0] : any>
    {
        return (await axios.get(url as string, config)).data;
    }

    export async function post<T extends keyof ENDPOINTS_POST | string>(
        url: T,
        ...data: (T extends keyof ENDPOINTS_POST ? [ENDPOINTS_POST[T][1], AxiosRequestConfig?] : [any?, AxiosRequestConfig?]))
        : Promise<T extends keyof ENDPOINTS_POST ? ENDPOINTS_POST[T][0] : any>
    {
        return (await axios.post(url as string, ...data as any)).data;
    }

    export async function put<T extends keyof ENDPOINTS_PUT | string>(
        url: T,
        ...data: (T extends keyof ENDPOINTS_PUT ? [ENDPOINTS_PUT[T][1], AxiosRequestConfig?] : [any?, AxiosRequestConfig?]))
        : Promise<T extends keyof ENDPOINTS_PUT ? ENDPOINTS_PUT[T][0] : any>
    {
        return (await axios.put(url as string, ...data as any)).data;
    }

    export async function del<T extends keyof ENDPOINTS_DELETE | string>(
        url: T,
        config?: AxiosRequestConfig)
        : Promise<T extends keyof ENDPOINTS_DELETE ? ENDPOINTS_DELETE[T][0] : any>
    {
        return (await axios.delete(url as string, config)).data;
    }
}
