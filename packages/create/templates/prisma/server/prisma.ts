import { PrismaClient } from '@prisma/client';
import {maybeInitPrisma} from "./prisma.init";


export default class Prisma {
    static client;

    static async init(silent?){
        this.client = new PrismaClient();
        return maybeInitPrisma(silent);
    }

    static close(){
        Prisma.client.$disconnect();
    }
}


