import {DEPLOY_CMD} from "./deploy";

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
    cmd: DEPLOY_CMD,
    id: string,
    data?: any
}
