import {DEPLOY_CMD} from "./deploy";
import {WATCH_CMD} from "./watch";

export type CMD = GLOBAL_CMD | WATCH_CMD | DEPLOY_CMD;

export enum GLOBAL_CMD {
    GET_CURRENT = "GET_CURRENT",
    END = "END"
}

export enum MESSAGE_TYPE {
    ERROR,
    LOG,
    RESPONSE,
    LINE,
    END_LINE,
    TICK
}

export type MESSAGE_FROM_BACKEND = {
    type: MESSAGE_TYPE,
    id?: string,
    data?: any
}

export type MESSAGE_FROM_GUI = {
    cmd: CMD,
    id: string,
    data?: any
}
