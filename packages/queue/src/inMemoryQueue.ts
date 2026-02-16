import { DeploymentQueueProducer } from "./interfaces/DeploymentQueueProducer";

const queue: string[] = [];

class InMemoryDeploymentQueueProducer implements DeploymentQueueProducer {
    async enqueueDeployment(deploymentId: string): Promise<void> {
        queue.push(deploymentId);
        console.log(`[InMemoryQueue] Enqueued deployment: ${deploymentId}`);
    }
}

export function createInMemoryProducer(): DeploymentQueueProducer {
    return new InMemoryDeploymentQueueProducer();
}
