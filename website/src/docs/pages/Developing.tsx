export default function(){
    return <>
        <h3>Command</h3>
        <div className={"box code"}>
            npx fullstacked watch
        </div>
        <p>
            This will run your app and hot reload the server and the web app on respective file changes.
            Your app will be accessible with a web browser at <span className={"code"}>http://localhost:8000</span>
        </p>
    </>
}
