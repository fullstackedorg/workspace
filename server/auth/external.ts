import HTML from "@fullstacked/webapp/server/HTML";
import arrow from "../arrow";

const authPage = new HTML();
authPage.addInHead(`<meta property="og:image" content="https://files.cplepage.com/fullstacked/sharing-image.jpg">`);
authPage.addInHead(`<title>FullStacked</title>`);
authPage.addInHead(`<link id="favicon" rel="shortcut icon" type="image/png" href="/pwa/app-icons/favicon.png">`);
authPage.addInHead(`<style>
        *{
            box-sizing: border-box;
        }
        html, body{
            background-color: #1e293c;
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
        function logout(){
            "${process.env.SESSION_COOKIES}".split(",").forEach(cookieName => {
                document.cookie = cookieName + "=; Max-Age=0";
            });
            
            if("${process.env.REVOKE_URL ?? ""}") {
                fetch("${process.env.REVOKE_URL}", {
                    method: "POST",
                    credentials: "include"
                });
            }
            
            const button = document.createElement("button");
            button.addEventListener("click", () => window.location.reload());
            button.classList.add("login-btn");
            button.innerHTML = \`${arrow}\`;
            document.body.append(button);
        }
        
        async function tryRefreshingToken(){
            let response, payload;
            try{
                response = await fetch("/", {method: "POST"});
                payload = await response.text();
            }catch (e) {
                throw e;
            }
            
            if(payload === "Bonjour")
                window.location.reload();
            else
                logout();
        }
        
        const url = new URL(window.location.href);
        if(url.searchParams.get("logout")){
            url.searchParams.delete("logout");
            window.history.replaceState(null, null, url.toString());
            
            logout();
        }else{
            tryRefreshingToken();
        }
    </script>`);

export default {
    html: authPage,
    validator: async req => {
        let response, payload;
        try{
            response = await fetch(process.env.AUTH_URL, {
                method: "POST",
                headers: {
                    authorization: process.env.AUTH_SECRET,
                    cookie: req.headers.cookie
                }
            });
            payload = await response.text();
        }catch (e){
            console.log(e);
            return e;
        }
        return !!payload;
    }
}
