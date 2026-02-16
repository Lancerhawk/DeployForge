import { prisma } from "@deployforge/database";
import { DeploymentStatus } from "@prisma/client";
import { AppError } from "../utils/AppError";
import type { DeploymentQueueProducer } from "@deployforge/queue";

export const ACTIVE_STATUSES: DeploymentStatus[] = [
    DeploymentStatus.QUEUED,
    DeploymentStatus.CLONING,
    DeploymentStatus.INSTALLING,
    DeploymentStatus.BUILDING,
    DeploymentStatus.UPLOADING,
];


export async function checkConcurrencyLimit(userId: string): Promise<void> {
    const activeCount = await prisma.deployment.count({
        where: {
            userId,
            status: {
                in: ACTIVE_STATUSES,
            },
        },
    });

    if (activeCount >= 2) {
        throw new AppError("Maximum active deployments reached", 400);
    }
}


export async function createDeployment(projectId: string, userId: string, producer: DeploymentQueueProducer) {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId: userId,
        },
    });

    if (!project) {
        throw new AppError("Project not found", 404);
    }

    await checkConcurrencyLimit(userId);

    const deployment = await prisma.deployment.create({
        data: {
            projectId,
            userId,
            status: DeploymentStatus.QUEUED,
            commitSha: null,
            artifactPath: null,
            errorMessage: null,
        },
    });

    await producer.enqueueDeployment(deployment.id);


    return {
        deploymentId: deployment.id,
        status: deployment.status,
    };
}


export async function getDeploymentById(id: string, userId: string) {
    const deployment = await prisma.deployment.findFirst({
        where: {
            id,
            userId,
        },
    });

    if (!deployment) {
        throw new AppError("Deployment not found", 404);
    }

    return {
        id: deployment.id,
        status: deployment.status,
        errorMessage: deployment.errorMessage,
        artifactPath: deployment.artifactPath,
        createdAt: deployment.createdAt,
        completedAt: deployment.completedAt,
    };
}
