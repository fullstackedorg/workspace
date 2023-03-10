import Deploy, {CredentialsSSH} from "@fullstacked/deploy"
import {bindCommandToWS} from "./index";

let deploy: Deploy;
function getDeploy(){
    if(!deploy) deploy = new Deploy();

    deploy.config.configFile = "./.fullstacked";
    bindCommandToWS(deploy);
    return deploy;
}

export default {
    getCredentialsSSH(){
        return getDeploy().credentialsSSH ?? null;
    },
    updateCredentialsSSH(credentialSSH: CredentialsSSH){
        getDeploy().credentialsSSH = credentialSSH;
    },

    testConnection(){
        return getDeploy().testRemoteServer();
    },
    testDocker(){
        return getDeploy().testDockerOnRemoteHost();
    },

    installDocker(){
        return getDeploy().tryToInstallDockerOnRemoteHost();
    },

    getServices(){
        return getDeploy().getServicesWithPortToSetup();
    },

    hasConfig(){
        return getDeploy().hasSavedConfigs();
    },
    loadConfig(password: string){
        const deploy = getDeploy();
        deploy.config.configPassword = password;
        return getDeploy().loadConfigs();
    },
    saveConfig(password: string){
        return getDeploy().saveConfigs(password);
    }
}
