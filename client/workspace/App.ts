import {ReactNode} from "react";

export type ActiveApp = ({
    id: string
} & App)

export type App = {
    title: string,
    icon: string,
    element: (app: ActiveApp) => ReactNode,
    order?: number,
    args?: any,
    callbacks?: {
        onWindowResize?(): void,
        onFocus?(): void,
        onClose?(): void
    }
}
