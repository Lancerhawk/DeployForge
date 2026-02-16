import express from "express";
import deploymentRoutes from "./routes/deployments";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3001; // Using 3001 to avoid conflict with frontend

// Middleware
app.use(express.json());

// Routes
app.use("/api/deployments", deploymentRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
});
