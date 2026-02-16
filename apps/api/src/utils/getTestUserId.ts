import { prisma } from "@deployforge/database";
import { AppError } from "../utils/AppError";

/**
 * Temporary helper to get test user ID.
 * TODO: Replace with actual auth middleware that extracts userId from JWT.
 */
export async function getTestUserId(): Promise<string> {
    const user = await prisma.user.findFirst();
    if (!user) {
        throw new AppError("No test user in database", 500);
    }
    return user.id;
}
