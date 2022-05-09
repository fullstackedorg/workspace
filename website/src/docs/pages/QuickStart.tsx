export default function(){
    return <>
        <br />
        <p>
            It will take less than a minute to setup you up! Give it a try!
        </p>
        <h3>Starting your project</h3>
        <ol>
            <li>
                <p>
                    Create a folder were you will develop your awesome web app.
                </p>
                <div className={"code box"}>
                    mkdir my-awesome-project<br />
                    cd my-awesome-project
                </div>
            </li>
            <li>
                <p>
                    Init npm
                </p>
                <div className={"code box"}>
                    npm init -y
                </div>
            </li>
            <li>
                <p>
                    Install FullStacked
                </p>
                <div className={"code box"}>
                    npm i fullstacked
                </div>
            </li>
            <li>
                <p>
                    Generate the default files
                </p>
                <div className={"code box"}>
                    npx fullstacked create
                </div>
            </li>
            <li>
                <p>
                    Start the watcher
                </p>
                <div className={"code box"}>
                    npx fullstacked watch
                </div>
            </li>
            <li>
                <p>Open <a href={"http://localhost:8000/"} target={"_blank"}>http://localhost:8000/</a> and start developing!</p>
            </li>
        </ol>


    </>
}
