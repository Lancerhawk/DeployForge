import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { getTestUserId } from "../utils/getTestUserId";
import * as deploymentService from "../services/deploymentService";

const router = Router();

/**
 * POST /api/deployments
 * Create a new deployment for a project.
 */
router.post(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        const { projectId } = req.body;

        // TODO: Replace with actual auth middleware
        const userId = await getTestUserId();

        // TODO: Add proper validation (type check, UUID format)
        if (!projectId) {
            throw new AppError("projectId is required", 400);
        }

        const result = await deploymentService.createDeployment(projectId, userId);

        res.status(201).json(result);
    })
);

/**
 * GET /api/deployments/:id
 * Get deployment details by ID.
 */
router.get(
    "/:id",
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // TODO: Replace with actual auth middleware
        const userId = await getTestUserId();

        const deployment = await deploymentService.getDeploymentById(id, userId);

        res.json(deployment);
    })
);

export default router;
