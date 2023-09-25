import {ReactNode} from "react";

export type App = {
    title: string,
    icon: string,
    element: (app: App) => ReactNode,
    order?: number,
    args?: any,
    callbacks?: {
        onWindowResize?(): void,
        onFocus?(): void,
        onClose?(): void
    }
}
