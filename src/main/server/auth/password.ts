import HTML from "@fullstacked/webapp/server/HTML";
import arrow from "./arrow";

const loginPage = new HTML();
loginPage.addInHead(`<meta property="og:image" content="https://files.cplepage.com/fullstacked/sharing-image.jpg">`);
loginPage.addInHead(`<title>FullStacked</title>`);
loginPage.addInHead(`<link id="favicon" rel="shortcut icon" type="image/png" href="/pwa/app-icons/favicon.png">`);
loginPage.addInHead(`<style>
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
    </style>`)
loginPage.addInBody(`
    <img src="/pwa/app-icons/app-icon.png" />
    <form>
        <input type="password" />
        <button>${arrow}</button>
    </form>
    <script type="module">
        document.querySelector("input").focus();
        
        async function submit(e){
            e.preventDefault();
            const response = await (await fetch("/", {
                method: "POST",
                body: JSON.stringify({
                    pass: document.querySelector("input").value
                })
            })).text();
            
            if(response === "Bonjour")
                window.location.reload();
        }
        document.querySelector("form").addEventListener("submit", submit)
    </script>`);



export default {
    html: loginPage,
    validator: async (req, body) => {
        const { pass } = body;
        return pass === process.env.PASS;
    }
}

