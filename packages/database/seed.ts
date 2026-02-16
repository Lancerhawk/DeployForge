import { config } from "dotenv";
import { resolve } from "path";
import { prisma } from "./src/client";

// Load .env from root
config({ path: resolve(__dirname, "../../.env") });

async function seed() {
    console.log("🌱 Seeding database...");

    // Create or find test user
    let user = await prisma.user.findUnique({
        where: { githubId: "test-github-123" },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                githubId: "test-github-123",
                username: "testuser",
                email: "test@example.com",
            },
        });
        console.log("Created user:", user.id);
    } else {
        console.log("User already exists:", user.id);
    }

    // Create or find test project
    let project = await prisma.project.findFirst({
        where: {
            userId: user.id,
            name: "test-project",
        },
    });

    if (!project) {
        project = await prisma.project.create({
            data: {
                userId: user.id,
                name: "test-project",
                repoUrl: "https://github.com/test/repo",
                branch: "main",
                buildCommand: "npm run build",
                outputDir: "dist",
            },
        });
        console.log("Created project:", project.id);
    } else {
        console.log("Project already exists:", project.id);
    }

    console.log("\nTest Data:");
    console.log(`User ID: ${user.id}`);
    console.log(`Project ID: ${project.id}`);
    console.log("\nTest with:");
    console.log(`curl -X POST http://localhost:3001/api/deployments \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"projectId": "${project.id}"}'`);
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
