import express from "express";
import { createDeploymentRouter } from "./routes/deployments";
import { errorHandler } from "./middleware/errorHandler";

import { createInMemoryProducer } from "@deployforge/queue";

const app = express();
const PORT = process.env.PORT || 3001;

const queueProducer = createInMemoryProducer();

app.use(express.json());

app.use("/api/deployments", createDeploymentRouter(queueProducer));

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
