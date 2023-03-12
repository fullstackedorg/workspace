import Deploy, {CredentialsSSH} from "@fullstacked/deploy"
import {bindCommandToWS} from "./index";
import {NginxConfig} from "@fullstacked/deploy/index";

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
        const services = getDeploy().getServicesWithPortToSetup();
        const nginxConfigs = getDeploy().nginxConfigs;

        if(!nginxConfigs)
            return services;

        return services.map(service => {
            const nginxConfig = nginxConfigs.find(config => config.name === service.name && config.port === service.port);
            if(!nginxConfig)
                return service;

            return {
                ...service,
                ...nginxConfig
            }
        });
    },
    updateNginxConfigs(nginxConfigs: NginxConfig[]){
        getDeploy().nginxConfigs = nginxConfigs.map(nginxConfig => ({
            ...nginxConfig,
            serverNames: nginxConfig.serverNames.filter(serverName => serverName)
        }));
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
