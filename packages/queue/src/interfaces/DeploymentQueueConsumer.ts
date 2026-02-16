export interface DeploymentQueueConsumer {
  start(): void;
  stop(): void;
}
