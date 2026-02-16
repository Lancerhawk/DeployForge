import "dotenv/config";
import { createInMemoryConsumer } from "@deployforge/queue";
import { processDeployment } from "./lifecycle/processDeployment";

console.log("[Worker] Starting...");

// Initialize Consumer with processing logic
const consumer = createInMemoryConsumer(processDeployment);

// Start polling
consumer.start();

console.log("[Worker] Started and polling...");

// Graceful Shutdown
process.on("SIGINT", () => {
    console.log("\n[Worker] Shutting down...");
    consumer.stop();
    process.exit(0);
});
