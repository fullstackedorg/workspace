import Deploy, {CertificateSSL, CredentialsSSH} from "@fullstacked/deploy"
import {bindCommandToWS} from "./index";
import {NginxConfig} from "@fullstacked/deploy";
import {X509Certificate} from "crypto";

let deploy: Deploy;
function getDeploy(){
    if(!deploy) deploy = new Deploy();

    deploy.config = {
        ...deploy.config,
        configFile: "./.fullstacked"
    };
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

    getServices(): NginxConfig[]{
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
            serverNames: nginxConfig.serverNames?.filter(serverName => serverName)
        }));
    },

    getCertificateSSL(){
        return getDeploy().certificateSSL;
    },
    updateCertificateSSL(certificate: CertificateSSL){
        getDeploy().certificateSSL = certificate;
    },
    getCertificateData(){
        const certificate = getDeploy().certificateSSL;

        if(!certificate) return null;

        const cert = new X509Certificate(certificate.fullchain);
        return {
            subject: cert.subject,
            validTo: cert.validTo,
            subjectAltName: cert.subjectAltName
        };
    },
    generateCertificateSSL(email: string, domains: string[]){
        return getDeploy().generateCertificateOnRemoteHost(email, domains);
    },

    launch(){
        return getDeploy().run();
    },
    getDeploymentProgress(){
        return getDeploy().progress;
    },


    hasConfig(){
        return getDeploy().hasSavedConfigs();
    },
    loadConfig(password: string){
        const deploy = getDeploy();
        deploy.config = {
            ...deploy.config,
            configPassword: password
        };
        return getDeploy().loadConfigs();
    },
    saveConfig(password: string){
        return getDeploy().saveConfigs(password);
    }
}
