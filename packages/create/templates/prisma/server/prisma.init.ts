import { PrismaClient } from '@prisma/client';
import {execSync} from "child_process";

async function prismaHealthCheck(){
    const client = new PrismaClient();
    await client.$connect();
    await client.$disconnect();
}

export async function maybeInitPrisma(silent: boolean = false){
    try{
        await prismaHealthCheck();
    }catch (e) {
        console.log("Initializing Prisma");
        execSync(`npx prisma generate && cp -rT node_modules / && npx prisma migrate dev --name init`,
            {stdio: silent ? "ignore" : "inherit"});
    }
}



