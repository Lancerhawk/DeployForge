import { prisma } from "@deployforge/database";

async function testDB() {
    try {
        console.log("🔍 Testing database connection...");
        const result = await prisma.user.findMany();
        console.log("DB OK:", result);
        console.log("Database is accessible and working!");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

testDB();
