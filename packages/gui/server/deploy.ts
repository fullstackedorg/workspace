import Deploy, {CredentialsSSH} from "@fullstacked/deploy"

let deploy: Deploy;
function getDeploy(){
    if(!deploy) deploy = new Deploy();
    return deploy;
}

export default {
    getCredentialsSSH(){
        return getDeploy().credentialsSSH ?? null;
    },
    updateCredentialsSSH(credentialSSH: CredentialsSSH){
        getDeploy().credentialsSSH = credentialSSH;
    }
}
