import { init } from "./init";
import { Sync } from "./sync";

init();

Sync.init();

[import("./terminal"),
import("./explorer"),
import("./browser"),
import("./latency"),
import("./codeOSS")];