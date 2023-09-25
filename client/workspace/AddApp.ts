import {App} from "./App";
import {Workspace} from "./index";
import CommandPalette from "../commandPalette";

function AddApp(app: App){
    Workspace.apps.push(app);
    CommandPalette.instance.forceUpdate();
}

export default AddApp;

(window as any).AddApp = AddApp;
