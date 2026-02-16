import { DeploymentQueueProducer } from "./interfaces/DeploymentQueueProducer";
import { DeploymentQueueConsumer } from "./interfaces/DeploymentQueueConsumer";

// Singleton internal queue storage (shared but NOT exported)
const queue: string[] = [];

// Internal helper to access queue (kept private to module)
function dequeue(): string | undefined {
    return queue.shift();
}

/**
 * In-memory deployment queue producer implementation.
 * This class is NOT exported to prevent direct instantiation.
 */
class InMemoryDeploymentQueueProducer implements DeploymentQueueProducer {
    async enqueueDeployment(deploymentId: string): Promise<void> {
        console.log(`[InMemoryQueue] Enqueued deployment: ${deploymentId}`);
        queue.push(deploymentId);
    }
}

/**
 * In-memory deployment queue consumer implementation.
 * This class is NOT exported to prevent direct instantiation.
 */
class InMemoryDeploymentQueueConsumer implements DeploymentQueueConsumer {
    private interval: NodeJS.Timeout | null = null;
    private isProcessing = false;
    private processFn: (deploymentId: string) => Promise<void>;

    constructor(processFn: (deploymentId: string) => Promise<void>) {
        this.processFn = processFn;
    }

    start(): void {
        if (this.interval) return;

        console.log("[InMemoryQueue] Consumer started");
        
        this.interval = setInterval(() => {
            // Concurrency guard: prevent overlapping processing
            if (this.isProcessing) return;

            const id = dequeue();
            if (!id) return;

            this.isProcessing = true;

            // Execute processing in async iife to handle promise without blocking interval
            (async () => {
                try {
                    await this.processFn(id);
                } catch (error) {
                    console.error("[InMemoryQueue] Processing failed:", error);
                } finally {
                    this.isProcessing = false;
                }
            })();
        }, 1000);
    }

    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log("[InMemoryQueue] Consumer stopped");
        }
    }
}

/**
 * Factory function to create a queue producer instance.
 */
export function createInMemoryProducer(): DeploymentQueueProducer {
    return new InMemoryDeploymentQueueProducer();
}

/**
 * Factory function to create a queue consumer instance.
 */
export function createInMemoryConsumer(processFn: (deploymentId: string) => Promise<void>): DeploymentQueueConsumer {
    return new InMemoryDeploymentQueueConsumer(processFn);
}
