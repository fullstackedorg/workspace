import {randomBytes} from "crypto";

export default function (){
    return randomBytes(6).toString('hex');
}
