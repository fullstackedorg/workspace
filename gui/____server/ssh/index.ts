export default async function(data){
    const deploy = require("../../../scripts/deploy.js");
    try{
        return await deploy.testSSHConnection(data);
    }catch (e){
        return e;
    }
}
