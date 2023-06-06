import crypto from "crypto";

const algorithm = 'aes-256-cbc';

export function decryptDataWithPassword(data: string, password: string){
    const hashedParts = data.split(":");
    const hashedIv = hashedParts.shift();
    const encryptedData = hashedParts.join(":");

    const iv = Buffer.from(hashedIv, 'hex');
    const encryptedText = Buffer.from(encryptedData, 'hex');

    const key = crypto.createHash('md5').update(password).digest("hex");

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    try{
        return JSON.parse(decrypted.toString());
    }catch (e) {
        throw Error("Wrong password or corrupt file");
    }
}

export function encryptDataWithPassword(data: any, password: string){
    const key = crypto.createHash('md5').update(password).digest("hex");
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ":" + encrypted.toString('hex');
}
