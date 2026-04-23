# UrbanMove – Fleet Tracking Platform: Walkthrough

## What Was Built

A complete **Cloud Native Smart Mobility Platform** for the UrbanMove project, implementing all functional requirements from the spec. This is a fullstack production-ready monorepo.

---

## Validation Results

| Check | Status |
|---|---|
| TypeScript compilation (`tsc -b`) | ✅ 0 errors |
| Node.js syntax (all backend files) | ✅ All pass |
| Frontend production build (`vite build`) | ✅ 8 chunks, 349ms |
| API auth flow (login → JWT) | ✅ Verified |
| Auth middleware (401 on protected routes) | ✅ Verified |

### Build Output
```
dist/assets/charts-D72U6mVA.js    391 kB (gzip 112 kB)
dist/assets/vendor-Do9lPA2M.js    219 kB (gzip  70 kB)
dist/assets/maps-BU1RYCnO.js      153 kB (gzip  44 kB)
dist/assets/index-Cx9YTa9r.js     149 kB (gzip  47 kB)
```

---

## Architecture Implemented

```
Users → CloudFront → S3 (React SPA)
                        │
              API Gateway (Cognito JWT)
                        │  VPC Link
              ┌─── Public Subnet ───┐
              │    ALB (port 80/443) │
              └─────────────────────┘
                        │
              ┌─── Private Subnet ──┐
              │  ECS Fargate         │
              │  (Node.js API :3000) │
              │        │             │
              │  Kinesis Stream ─── Lambda Processor
              │        │             │       │
              │  DynamoDB (4 tables) │      S3 Data Lake
              │                      │
              │  Lambda Analytics ───┘
              │  (every 5 min)
              │
              │  CloudWatch (Dashboard + Alarms)
              └──────────────────────────────────┘
```

---

## Files Created

### Frontend (`frontend/`)
| File | Purpose |
|---|---|
| `src/main.tsx` | App entry — QueryClient, BrowserRouter, Toaster |
| `src/App.tsx` | Route definitions with protected routes |
| `src/index.css` | Global dark glassmorphism design system |
| `src/pages/Auth/LoginPage.tsx` | Login with demo credential helpers |
| `src/pages/Dashboard/DashboardPage.tsx` | Live Leaflet map + KPI cards + alerts |
| `src/pages/Vehicles/VehiclesPage.tsx` | Fleet registry CRUD with modal |
| `src/pages/Routes/RoutesPage.tsx` | Route planner + 3 recommendations + map |
| `src/pages/Analytics/AnalyticsPage.tsx` | Gauges, heatmaps, trend charts |
| `src/pages/Alerts/AlertsPage.tsx` | Real-time feed with acknowledge/resolve |
| `src/components/Layout.tsx` | Sidebar + topbar + live alert badge |
| `src/services/api.ts` | Axios client with JWT interceptor |
| `src/store/authStore.ts` | Zustand store, persisted to localStorage |
| `vite.config.ts` | Proxy to :3000, code splitting |
| `Dockerfile` | Multi-stage (build + nginx) |
| `nginx.conf` | SPA routing + static asset caching |

### Backend (`backend/`)
| File | Purpose |
|---|---|
| `src/app.js` | Express app — cors, helmet, rate-limit, morgan |
| `src/routes/auth.js` | Login, register, refresh, /me — demo users + JWT |
| `src/routes/vehicles.js` | Full CRUD with role-based auth |
| `src/routes/telemetry.js` | Ingest → Kinesis + DynamoDB, query history |
| `src/routes/routes.js` | Route recommendations (3 options) + save |
| `src/routes/alerts.js` | Alert CRUD + acknowledge/resolve |
| `src/routes/analytics.js` | Summary, congestion, utilization, speed trends |
| `src/services/dynamodb.js` | DynamoDB v3 client + generic helpers |
| `src/services/kinesis.js` | Kinesis producer (single + batch publish) |
| `src/middleware/auth.js` | JWT verify + RBAC (Admin/Operator/Viewer) |
| `Dockerfile` | Multi-stage dev + production |

### Infrastructure (`infra/`)
| File | Purpose |
|---|---|
| `terraform/vpc.tf` | VPC, 2 public + 2 private subnets, NAT GWs, SGs, VPC Endpoints |
| `terraform/ecs.tf` | ECS Fargate cluster, task def, service, auto-scaling (2–10) |
| `terraform/alb.tf` | ALB in public subnets, target group, health checks |
| `terraform/api_gateway.tf` | HTTP API GW v2, VPC Link, Cognito JWT authorizer, route definitions |
| `terraform/cognito.tf` | User pool, MFA, groups (Admin/Operator/Viewer), app client |
| `terraform/dynamodb.tf` | 4 tables with GSIs, PITR, SSE-KMS |
| `terraform/kinesis.tf` | 2-shard stream with KMS encryption |
| `terraform/lambda.tf` | Processor (Kinesis trigger) + analytics (EventBridge schedule) |
| `terraform/s3.tf` | Frontend bucket + CloudFront OAC, data lake with lifecycle |
| `terraform/cloudwatch.tf` | Dashboard, alarms for 5xx, CPU, Lambda errors |
| `localstack/init-aws.sh` | Bootstrap DynamoDB tables, Kinesis, S3, seed 15 demo vehicles (Linux) |
| `localstack/init-aws.ps1` | Bootstrap DynamoDB tables, Kinesis, S3, seed 15 demo vehicles (Windows) |
| `localstack/simulator.js` | 20 virtual vehicles with realistic GPS movement |

### Lambda (`lambda/`)
| File | Purpose |
|---|---|
| `processor/index.js` | Kinesis batch → DynamoDB writes + S3 archive |
| `analytics/index.js` | Computes zone metrics, hourly activity, utilization |

---

## How to Run Locally

```bash
# Option 1: Full Docker stack (recommended)
# Note: On Linux/macOS, ensure the init script is executable: chmod +x infra/localstack/init-aws.sh
# On Windows, you can manually initialize LocalStack using the PowerShell script: .\infra\localstack\init-aws.ps1
docker-compose up --build

# Option 2: Backend only
cd backend && npm run dev   # :3000

# Option 3: Frontend only
cd frontend && npm run dev  # :5173
```

**Login:**
- Admin: `admin@urbanmove.io` / `Admin@123`
- Operator: `operator@urbanmove.io` / `Operator@123`

---

## How to Deploy to Production (AWS)

The infrastructure is entirely codified using Terraform and relies on AWS services for production. Make sure you have the AWS CLI installed, configured, and Docker running.

### 1. Build and Push the Docker Image to ECR
First, create an Amazon Elastic Container Registry (ECR) repository to hold the backend API image.
```bash
# Authenticate Docker to your AWS ECR
aws ecr get-login-password --region us-west-3 | docker login --username AWS --password-stdin <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-west-3.amazonaws.com

# Create an ECR repository
aws ecr create-repository --repository-name urbanmove-api --region us-east-1

# Build the backend API image
docker build -t urbanmove-api ./backend

# Tag and push the image to ECR
docker tag urbanmove-api:latest <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/urbanmove-api:latest
docker push <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/urbanmove-api:latest
```

### 2. Deploy Infrastructure using Terraform
Now, deploy the VPC, ECS Cluster, Load Balancer, API Gateway, Serverless resources, and DynamoDB.
```bash
cd infra/terraform

# Initialize Terraform (downloads AWS providers)
terraform init

# Review the infrastructure plan
terraform plan -var="container_image=<YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/urbanmove-api:latest"

# Apply the infrastructure
terraform apply -var="container_image=<YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/urbanmove-api:latest"
```
After deployment, Terraform will output multiple URLs, including:
- `api_gateway_url` (Your production backend URL)
- `cloudfront_domain` (Your production frontend URL)
- `cognito_user_pool_id` (Used for user authentication)

### 3. Deploy the Frontend (SPA) to S3 + CloudFront
Once the API is live, you must build the frontend and upload it to the S3 hosting bucket created by Terraform.

1. Create a `.env` file in the `/frontend` directory containing the `api_gateway_url`:
   ```env
   VITE_API_URL=<YOUR_API_GATEWAY_URL>
   ```

2. Build the production React assets:
   ```bash
   cd frontend
   npm run build
   ```

3. Sync the compiled `dist/` directory to the newly created S3 bucket:
   ```bash
   # Find your S3 bucket name in Terraform outputs (e.g. urbanmove-frontend-<account-id>)
   aws s3 sync dist/ s3://urbanmove-frontend-<YOUR_AWS_ACCOUNT_ID>
   ```
4. Access the platform at the `cloudfront_domain` returned by Terraform. Note that it will be secured by HTTPS automatically.

---

## Security Architecture

| Layer | Implementation |
|---|---|
| Authentication | AWS Cognito JWT + local fallback (dev) |
| Authorization | RBAC: Admin → all, Operator → CRUD, Viewer → read |
| Network | Public subnet (ALB), Private subnet (ECS) |
| Private connectivity | VPC Link (API GW → ALB), VPC Endpoints (DynamoDB, S3) |
| API protection | API GW throttling: 500 req/s, JWT required on all non-auth routes |
| Data encryption | DynamoDB SSE-KMS, Kinesis KMS, S3 default encryption |
| Headers | Helmet.js (CSP, HSTS, X-Frame-Options) |
| Rate limiting | express-rate-limit: 500 req/15min per IP |

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | No | Health check |
| POST | /auth/login | No | Get JWT tokens |
| POST | /auth/register | No | Create account |
| POST | /auth/refresh | No | Refresh access token |
| GET | /auth/me | No | Get current user |
| GET | /vehicles | Yes | List fleet (paginated) |
| POST | /vehicles | Operator+ | Register vehicle |
| GET | /vehicles/:id | Yes | Vehicle detail |
| PUT | /vehicles/:id | Operator+ | Update vehicle |
| DELETE | /vehicles/:id | Admin | Deactivate vehicle |
| POST | /telemetry | No (device) | Ingest GPS event |
| GET | /telemetry/:vehicleId | Yes | Query history |
| GET | /routes/recommend | Yes | Get 3 route options |
| POST | /routes/calculate | Yes | Save planned route |
| GET | /alerts | Yes | List alerts (filterable) |
| POST | /alerts | No (device) | Create alert |
| PUT | /alerts/:id/acknowledge | Operator+ | Acknowledge |
| PUT | /alerts/:id/resolve | Operator+ | Resolve |
| GET | /analytics/summary | Yes | Platform KPIs |
| GET | /analytics/congestion | Yes | Zone congestion index |
| GET | /analytics/utilization | Yes | Fleet utilization |
| GET | /analytics/speed-trends | Yes | Speed over time |
