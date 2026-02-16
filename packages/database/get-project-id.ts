import { config } from "dotenv";
import { resolve } from "path";
import { prisma } from "./src/client";

config({ path: resolve(__dirname, "../../.env") });

async function getProjectId() {
    const project = await prisma.project.findFirst();

    if (project) {
        console.log(project.id);
    } else {
        console.error("No project found! Run 'npm run db:seed' first.");
        process.exit(1);
    }
}

getProjectId()
    .finally(async () => {
        await prisma.$disconnect();
    });
