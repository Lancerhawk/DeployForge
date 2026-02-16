# DeployForge

> **Production-grade, distributed build and deployment platform for frontend engineers.**

DeployForge bridges the gap between static code and global availability. It is architected to behave like a distributed system, ensuring clear separation of concerns, reliable lifecycle management, and high observability.

![License](https://img.shields.io/github/license/Lancerhawk/DeployForge?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg?style=flat-square)

---

## 📚 Documentation

- [**System Architecture**](#-system-architecture) - Deep dive into the distributed flow.
- [**Project Structure**](#-project-structure) - Overview of the monorepo layout.
- [**Contributing Guidelines**](CONTRIBUTING.md) - How to get started and technical standards.
- [**Security Policy**](SECURITY.md) - How to report vulnerabilities.
- [**Changelog**](CHANGELOG.md) - Version history and tracking.

---

## 🏗 Core Architecture Principles

- **Separation of Concerns**: The API (Control Plane) and Worker (Execution engine) are strictly separated runtimes.
- **Queue-Based Processing**: All build jobs are handled asynchronously via a pull-based queue system (Redis or SQS).
- **Stateless Workers**: Workers are ephemeral and idempotent. They fetch state from the DB and push build artifacts to S3.
- **Artifact Immutability**: Every deployment creates a unique, immutable path in S3. Overwriting is strictly prohibited.
- **Observability**: Centralized logging via a shared logger package and real-time status tracking in the DB.

## 🏗 System Architecture

The following diagram illustrates the distributed flow of a deployment job from the Frontend to S3 Artifact storage.

```mermaid
flowchart TB

subgraph Frontend
    FE[Next.js Dashboard]
end

subgraph API_Layer
    API[Express API]
end

subgraph Queue_Layer
    Q[(Queue)]
end

subgraph Worker_Layer
    W[Worker Process]
end

subgraph Database
    U[(users)]
    P[(projects)]
    D[(deployments)]
end

subgraph Storage
    S3[(S3 Bucket)]
end

FE -->|Create Deployment Request| API
API -->|Check Active Deployments| D
API -->|Insert Deployment with status QUEUED| D
API -->|Push Job| Q
Q -->|Job Consumed| W
W -->|Update Deployment Status| D
W -->|Upload Build Artifact| S3
FE -->|Fetch Deployment Status| API
API --> D
```

---

## 📁 Project Structure

DeployForge is a **TypeScript Monorepo** using **npm workspaces**.

```mermaid
flowchart LR

Root["deployforge/"]

Root --> Apps["apps/"]
Root --> Packages["packages/"]
Root --> Infra["infra/"]
Root --> RootFiles["root files"]

%% =====================
%% APPS
%% =====================

Apps --> API["api/"]
API --> API_SRC["src/"]
API_SRC --> API_SERVER["server.ts"]
API --> API_PKG["package.json"]
API --> API_TSCONFIG["tsconfig.json"]

Apps --> Worker["worker/"]
Worker --> WORKER_SRC["src/"]
WORKER_SRC --> WORKER_ENTRY["worker.ts"]
Worker --> WORKER_PKG["package.json"]
Worker --> WORKER_TSCONFIG["tsconfig.json"]

Apps --> Frontend["frontend/"]
Frontend --> FE_APP["app/"]
Frontend --> FE_COMPONENTS["components/"]
Frontend --> FE_PKG["package.json"]
Frontend --> FE_CONFIG["next.config.js"]

%% =====================
%% PACKAGES
%% =====================

Packages --> Database["database/"]
Database --> DB_PRISMA["prisma/"]
DB_PRISMA --> DB_SCHEMA["schema.prisma"]
DB_PRISMA --> DB_MIGRATIONS["migrations/"]
Database --> DB_SRC["src/"]
DB_SRC --> DB_CLIENT["client.ts"]
Database --> DB_PKG["package.json"]

Packages --> Queue["queue/"]
Queue --> Q_SRC["src/"]
Queue --> Q_PKG["package.json"]

Packages --> Storage["storage/"]
Storage --> S_SRC["src/"]
Storage --> S_PKG["package.json"]

Packages --> Config["config/"]
Config --> C_SRC["src/"]
Config --> C_PKG["package.json"]

Packages --> Logger["logger/"]
Logger --> L_SRC["src/"]
Logger --> L_PKG["package.json"]

%% =====================
%% INFRA
%% =====================

Infra --> AWS["aws/"]
Infra --> Docker["docker/"]
Infra --> Nginx["nginx/"]

%% =====================
%% ROOT FILES
%% =====================

RootFiles --> RootPkg["package.json"]
RootFiles --> TsBase["tsconfig.base.json"]
RootFiles --> DockerCompose["docker-compose.yml"]
RootFiles --> EnvExample[".env.example"]
RootFiles --> Readme["README.md"]
RootFiles --> Changelog["CHANGELOG.md"]
RootFiles --> License["LICENSE"]
```

### 📱 Applications (`/apps`)
- **`api/`**: The Control Plane.
    - `src/routes/`: Express/Fastify route definitions.
    - `src/controllers/`: Request handling and validation logic.
    - `src/services/`: Business logic (e.g., job queuing, limit enforcement).
    - `src/middleware/`: Auth (GitHub OAuth) and security guards.
    - `server.ts`: API entry point.
- **`worker/`**: The Execution Engine.
    - `src/lifecycle/`: Handles state transitions (Cloning -> Building -> Uploading).
    - `src/jobs/`: Queue polling and job processing logic.
    - `src/services/`: External integrations (S3, Git).
    - `worker.ts`: Worker process entry point.
- **`frontend/`**: The Dashboard (Next.js).
    - Built with the App Router, communicating exclusively with the API.

### 📦 Shared Packages (`/packages`)
- **`database/`**: Prisma ORM foundation. Exports a singleton Prisma client to prevent connection exhaustion.
- **`queue/`**: Abstraction layer for Redis/SQS with explicit `createProducer()` and `createConsumer()` roles.
- **`storage/`**: S3 integration for immutable artifact storage.
- **`logger/`**: Standardized JSON logging for cross-service consistency.
- **`config/`**: Centralized, schema-validated environment variable management.

### 🛠 Infrastructure (`/infra`)
- **`docker/`**: Service Dockerfiles.
- **`nginx/`**: Reverse proxy and load balancing configurations.
- **`aws/`**: Terraform/CloudFormation or IAM/S3 policy templates.

---

## �️ Database Schema

DeployForge uses PostgreSQL (hosted on Supabase) with Prisma ORM. The schema enforces referential integrity and tracks the complete deployment lifecycle.

```mermaid
erDiagram
    User ||--o{ Project : owns
    User ||--o{ Deployment : creates
    Project ||--o{ Deployment : contains

    User {
        string id
        string githubId
        string username
        string email
        datetime createdAt
    }

    Project {
        string id
        string userId
        string name
        string repoUrl
        string branch
        string buildCommand
        string outputDir
        datetime createdAt
        datetime updatedAt
    }

    Deployment {
        string id
        string projectId
        string userId
        string status
        string commitSha
        string artifactPath
        string errorMessage
        datetime createdAt
        datetime updatedAt
        datetime completedAt
    }
```

---

## �🔄 Deployment Lifecycle

Deployments move through a strict state machine to ensure reliability and user-level concurrency control:

1.  **QUEUED**: Job created in DB and pushed to queue.
2.  **CLONING**: Worker pulls job and clones the GitHub repository.
3.  **INSTALLING**: Running `npm install` or equivalent.
4.  **BUILDING**: Executing the build command.
5.  **UPLOADING**: Syncing build output to S3.
6.  **DEPLOYED**: Final terminal state.

*Failure or cancellation results in a **FAILED** or **CANCELLED** state, freeing up a concurrency slot.*

---

## 🛡 Security & Guardrails

DeployForge is designed for safe execution:
- **Concurrency Limits**: Each user is limited to **2 active deployments** at a time.
- **Build Timeouts**: Hard limits (e.g., 5-7 minutes) to prevent runaway processes.
- **Resource Constraints**: Repository size limits and output size validation during building.
- **Stateless Execution**: Workers clean up temporary disk space after every job.

---

## 🚀 Local Development

1.  **Install dependencies**: `npm install`
2.  **Setup Environment**: `cp .env.example .env` (Update with your Supabase/AWS/Redis credentials)
3.  **Start Infrastructure**: `docker-compose up -d` (Starts Redis for the queue)
4.  **Launch Services**:
    - Build: `npm run build`
    - API: `npm run dev:api`
    - Worker: `npm run dev:worker`
    - Frontend: `npm run dev:frontend`

---

## 📄 License
Licensed under the [MIT License](LICENSE).
