import { init } from "../../main/client/init";
import { Sync } from "../../main/client/sync";

init();

Sync.init(false, true);

[import("./apps")];