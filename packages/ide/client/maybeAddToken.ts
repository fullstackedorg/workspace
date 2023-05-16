import cookie from "cookie";

export const maybeAddToken = (url: URL) => {
    const token = cookie.parse(document.cookie).token;
    if(token) url.searchParams.set("token", token);
    return url.toString();
}
