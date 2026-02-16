import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { getTestUserId } from "../utils/getTestUserId";
import * as deploymentService from "../services/deploymentService";

import { DeploymentQueueProducer } from "@deployforge/queue";

export function createDeploymentRouter(producer: DeploymentQueueProducer) {
    const router = Router();

    router.post(
        "/",
        asyncHandler(async (req: Request, res: Response) => {
            const { projectId } = req.body;

            const userId = await getTestUserId();

            if (!projectId) {
                throw new AppError("projectId is required", 400);
            }

            const result = await deploymentService.createDeployment(projectId, userId, producer);

            res.status(201).json(result);
        })
    );

    router.get(
        "/:id",
        asyncHandler(async (req: Request, res: Response) => {
            const { id } = req.params;

            const userId = await getTestUserId();

            const deployment = await deploymentService.getDeploymentById(id, userId);

            res.json(deployment);
        })
    );

    return router;
}
