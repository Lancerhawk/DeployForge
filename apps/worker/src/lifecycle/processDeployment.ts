import { prisma } from "@deployforge/database";
import { DeploymentStatus } from "@prisma/client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function processDeployment(id: string) {
  // 1. Check ID and Status (Idempotency)
  const deployment = await prisma.deployment.findUnique({ where: { id } });

  if (!deployment) {
    console.error(`[Worker] Deployment not found: ${id}`);
    return;
  }

  if (deployment.status !== DeploymentStatus.QUEUED) {
    console.log(`[Worker] Skipping ${id}: Status is ${deployment.status}, expected QUEUED`);
    return;
  }

  console.log(`[Worker] Processing ${id}`);

  // 2. Simulate Lifecycle (Sequential Updates)
  
  // CLONING
  await prisma.deployment.update({
    where: { id },
    data: { status: DeploymentStatus.CLONING },
  });
  console.log(`[Worker] Status → CLONING`);
  await sleep(1000);

  // INSTALLING
  await prisma.deployment.update({
    where: { id },
    data: { status: DeploymentStatus.INSTALLING },
  });
  console.log(`[Worker] Status → INSTALLING`);
  await sleep(1000);

  // BUILDING
  await prisma.deployment.update({
    where: { id },
    data: { status: DeploymentStatus.BUILDING },
  });
  console.log(`[Worker] Status → BUILDING`);
  await sleep(1000);

  // UPLOADING
  await prisma.deployment.update({
    where: { id },
    data: { status: DeploymentStatus.UPLOADING },
  });
  console.log(`[Worker] Status → UPLOADING`);
  await sleep(1000);

  // DEPLOYED (Final Step)
  await prisma.deployment.update({
    where: { id },
    data: { 
      status: DeploymentStatus.DEPLOYED,
      completedAt: new Date()
    },
  });
  console.log(`[Worker] Status → DEPLOYED`);
  console.log(`[Worker] Finished ${id}`);
}
