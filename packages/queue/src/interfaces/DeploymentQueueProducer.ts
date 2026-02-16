export interface DeploymentQueueProducer {
    
    enqueueDeployment(deploymentId: string): Promise<void>;
}
