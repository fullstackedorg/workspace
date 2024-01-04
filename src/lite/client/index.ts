import { init } from "../../main/client/init";
import { Sync } from "../../main/client/sync";
import { client } from "./client";

init();

await Sync.init(false);
if (await client.get().directory.check()){
    Sync.openSetup(() => Sync.init(false));
}

[import("./apps")];
