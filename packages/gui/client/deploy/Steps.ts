import SSH from "./Steps/SSH";
import Nginx from "./Steps/Nginx";
import SSL from "./Steps/SSL";
import Deployment from "./Steps/Deployment";
import Save from "./Steps/Save";

export const steps = [
    {
        slug: "",
        title: "SSH Connection",
        component: SSH
    },{
        slug: "/nginx",
        title: "Nginx Configuration",
        component: Nginx
    },{
        slug: "/ssl",
        title: "SSL Certificates",
        component: SSL
    },{
        slug: "/deployment",
        title: "Deployment",
        component: Deployment
    },{
        slug: "/save",
        title: "Save",
        component: Save
    }
]
