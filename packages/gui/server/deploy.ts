import {bindCommandToWS} from "./websocket";
import type {CertificateSSL, CredentialsSSH, NginxConfig} from "@fullstacked/deploy";
import type Deploy from "@fullstacked/deploy";
import {X509Certificate} from "crypto";

let deploy: Deploy;
async function getDeploy(){
    const DeployModules = (await import("@fullstacked/deploy")).default;
    if(!deploy) deploy = new DeployModules();

    deploy.config = {
        ...deploy.config,
        configFile: "./.fullstacked"
    };
    bindCommandToWS(deploy);
    return deploy;
}

export default {
    async getCredentialsSSH(){
        return (await getDeploy()).credentialsSSH ?? null;
    },
    async updateCredentialsSSH(credentialSSH: CredentialsSSH){
        (await getDeploy()).credentialsSSH = credentialSSH;
    },

    async testConnection(){
        return (await getDeploy()).testRemoteServer();
    },
    async testDocker(){
        return (await getDeploy()).testDockerOnRemoteHost();
    },

    async installDocker(){
        return (await getDeploy()).tryToInstallDockerOnRemoteHost();
    },

    async getServices(): Promise<NginxConfig[]>{
        const services = (await getDeploy()).getServicesWithPortToSetup();
        const nginxConfigs = (await getDeploy()).nginxConfigs;

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
    async updateNginxConfigs(nginxConfigs: NginxConfig[]){
        (await getDeploy()).nginxConfigs = nginxConfigs.map(nginxConfig => ({
            ...nginxConfig,
            serverNames: nginxConfig.serverNames?.filter(serverName => serverName)
        }));
    },

    async getCertificateSSL(){
        return (await getDeploy()).certificateSSL;
    },
    async updateCertificateSSL(certificate: CertificateSSL){
        (await getDeploy()).certificateSSL = certificate;
    },
    async getCertificateData(){
        const certificate = (await getDeploy()).certificateSSL;

        if(!certificate) return null;

        const cert = new X509Certificate(certificate.fullchain);
        return {
            subject: cert.subject,
            validTo: cert.validTo,
            subjectAltName: cert.subjectAltName
        };
    },
    async generateCertificateSSL(email: string, domains: string[]){
        return (await getDeploy()).generateCertificateOnRemoteHost(email, domains);
    },

    async launch(pull: boolean = false){
        const deploy = await getDeploy();
        deploy.config = {
            ...deploy.config,
            pull
        }
        return deploy.run();
    },
    async getDeploymentProgress(){
        return (await getDeploy()).progress;
    },


    async hasConfig(){
        return (await getDeploy()).hasSavedConfigs();
    },
    async loadConfig(password: string){
        const deploy = (await getDeploy());
        deploy.config = {
            ...deploy.config,
            configPassword: password
        };
        return (await getDeploy()).loadConfigs();
    },
    async saveConfig(password: string){
        return (await getDeploy()).saveConfigs(password);
    }
}
