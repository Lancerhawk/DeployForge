import { prisma } from "@deployforge/database";
import { DeploymentStatus } from "@prisma/client";
import { AppError } from "../utils/AppError";

/**
 * Active deployment statuses that count toward concurrency limit.
 * These represent deployments that are currently consuming resources.
 * Exported for use in worker and other services.
 */
export const ACTIVE_STATUSES: DeploymentStatus[] = [
    DeploymentStatus.QUEUED,
    DeploymentStatus.CLONING,
    DeploymentStatus.INSTALLING,
    DeploymentStatus.BUILDING,
    DeploymentStatus.UPLOADING,
];

/**
 * Allowed status transitions (enforced by Worker, documented here for reference):
 * 
 * QUEUED → CLONING
 * CLONING → INSTALLING
 * INSTALLING → BUILDING
 * BUILDING → UPLOADING
 * UPLOADING → DEPLOYED
 * ANY → FAILED
 * ANY → CANCELLED
 */

/**
 * Check if user has reached the maximum concurrent deployment limit (2).
 */
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

/**
 * Create a new deployment record with status QUEUED.
 * 
 * ⚠️ CRITICAL: Race condition risk - This function is NOT atomic.
 * 
 * Current flow:
 * 1. Check concurrency limit (SELECT COUNT)
 * 2. Create deployment (INSERT)
 * 
 * Problem: Under heavy concurrent traffic, two requests could both pass the
 * count check before either inserts, resulting in 3 active deployments.
 * 
 * Example race condition:
 * - Request A: Checks count (2 active) → passes
 * - Request B: Checks count (2 active) → passes
 * - Request A: Creates deployment (now 3 active)
 * - Request B: Creates deployment (now 4 active) ❌
 * 
 * Solution (to be implemented with queue integration):
 * await prisma.$transaction(async (tx) => {
 *   const activeCount = await tx.deployment.count({ ... });
 *   if (activeCount >= 2) throw error;
 *   await tx.deployment.create({ ... });
 * });
 * 
 * For Phase 1: Acceptable risk (low traffic, testing only)
 * For Production: MUST be wrapped in transaction
 */
export async function createDeployment(projectId: string, userId: string) {
    // Verify project exists AND belongs to user (single query optimization)
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId: userId,
        },
    });

    if (!project) {
        throw new AppError("Project not found", 404);
    }

    // Check concurrency limit
    await checkConcurrencyLimit(userId);

    // Create deployment
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

    return {
        deploymentId: deployment.id,
        status: deployment.status,
    };
}

/**
 * Get deployment by ID with ownership validation (single query optimization).
 */
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
