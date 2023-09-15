import HTML from "@fullstacked/webapp/server/HTML";
import arrow from "../arrow";

const authPage = new HTML();
authPage.addInHead(`<meta property="og:image" content="https://files.cplepage.com/fullstacked/sharing-image.jpg">`);
authPage.addInHead(`<title>FullStacked</title>`);
authPage.addInHead(`<link id="favicon" rel="shortcut icon" type="image/png" href="/pwa/app-icons/favicon.png">`);
authPage.addInHead(`<style>
        *{
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        html, body{
            background-color: #1e293c;
            font-family: sans-serif;
            color: white;
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
        }
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        a {
            color: inherit;
        }
        img {
            height: 70px;
            margin: 20px;
        }
        form {
            display: flex;
            align-items: center;
            border-radius: 5px;
            box-shadow: 0 0 15px 2px #a5afc240;
            background-color: #2b3952;
            transition: 0.2s background-color;
        }
        form:hover {
            background-color: #374662;
        }
        input, button {
            background-color: transparent;
            color: #e9edf4;
            border: 1px solid #777f8c;
            font-size: large;
            margin: 0;
        }
        button {
            height: 100%;
            border-left: 0;
            border-radius: 0 5px 5px 0;
            padding: 0 10px;
            cursor: pointer;
        }
        input {
            padding: 6px 10px;
            border-radius: 5px 0 0 5px;
            outline: 0;
        }
        svg{
            vertical-align: middle;
        }
        .login-btn {
            height: auto;
            padding: 5px 10px;
            border-radius: 5px;
            border-left: 1px solid #777f8c;
        }
    </style>`)
authPage.addInBody(`
    <img src="/pwa/app-icons/app-icon.png" />
    <script type="module">
        async function tryRefreshingToken(){
            let response, payload;
            try{
                response = await fetch("/", {method: "POST"});
                payload = await response.text();
            }catch (e) {
                throw e;
            }
            
            if(payload === "Bonjour")
                return window.location.reload();
            
            const msg = document.createElement("div");
            msg.innerHTML = payload;
            msg.style.marginBottom = "10px";
            document.body.append(msg);
        }
        
        const url = new URL(window.location.href);
        if(url.searchParams.get("logout")){
            url.searchParams.delete("logout");
            window.history.replaceState(null, null, url.toString());
            
            ${process.env.LOGOUT_REDIRECT
                ? `window.location.href = "${process.env.LOGOUT_REDIRECT}";`
                : ""}
        }else{
            tryRefreshingToken();
        }
    </script>`);

export default {
    html: authPage,
    validator: async req => {
        let response, authorization;
        try{
            response = await fetch(process.env.AUTH_URL, {
                method: "GET",
                headers: {
                    cookie: req.headers.cookie
                }
            });

            authorization = await response.text();

            if(response.status >= 400)
                return new Error(authorization);
        }catch (e){
            console.log(e);
            return e;
        }

        return !!authorization;
    }
}
