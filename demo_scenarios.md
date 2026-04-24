# UrbanMove — Cloud Architecture Video Demo Script

> **Total Duration:** ~30 minutes  
> **Focus:** Cloud architecture implementation (not application functionality)  
> **Platform:** AWS  
> **Tools Shown:** Terraform, Docker, **AWS Console (live)**, LocalStack, Terminal

---

## Pre-Demo Checklist

Before recording, ensure the following are ready:

- [ ] Local Docker stack running (`docker-compose up --build`)
- [ ] AWS Console logged in with the project account
- [ ] Terminal open at `/fleet-tracking` project root
- [ ] VS Code / editor with Terraform files open
- [ ] Architecture diagram (`architecture.png`) ready to show
- [ ] **AWS Console browser tabs pre-opened** (bookmark these URLs for quick access):

| Tab # | Service | URL |
|-------|---------|-----|
| 1 | VPC Dashboard | `https://us-east-1.console.aws.amazon.com/vpc/home?region=us-east-1#vpcs:` |
| 2 | VPC Subnets | `https://us-east-1.console.aws.amazon.com/vpc/home?region=us-east-1#subnets:` |
| 3 | VPC Security Groups | `https://us-east-1.console.aws.amazon.com/vpc/home?region=us-east-1#SecurityGroups:` |
| 4 | VPC Endpoints | `https://us-east-1.console.aws.amazon.com/vpc/home?region=us-east-1#Endpoints:` |
| 5 | ECS Clusters | `https://us-east-1.console.aws.amazon.com/ecs/v2/clusters?region=us-east-1` |
| 6 | ECS Service | `https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/urbanmove-cluster/services?region=us-east-1` |
| 7 | ECS Tasks | `https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/urbanmove-cluster/tasks?region=us-east-1` |
| 8 | ECR Repository | `https://us-east-1.console.aws.amazon.com/ecr/repositories?region=us-east-1` |
| 9 | ALB | `https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#LoadBalancers:` |
| 10 | Target Groups | `https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#TargetGroups:` |
| 11 | API Gateway | `https://us-east-1.console.aws.amazon.com/apigateway/main/apis?region=us-east-1` |
| 12 | Cognito User Pools | `https://us-east-1.console.aws.amazon.com/cognito/v2/idp/user-pools?region=us-east-1` |
| 13 | DynamoDB Tables | `https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables` |
| 14 | Kinesis Streams | `https://us-east-1.console.aws.amazon.com/kinesis/home?region=us-east-1#/streams` |
| 15 | Lambda Functions | `https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions` |
| 16 | S3 Buckets | `https://s3.console.aws.amazon.com/s3/buckets?region=us-east-1` |
| 17 | CloudWatch Dashboard | `https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=urbanmove-dashboard` |
| 18 | CloudWatch Alarms | `https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:` |
| 19 | CloudWatch Logs | `https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups` |
| 20 | CloudFront | `https://us-east-1.console.aws.amazon.com/cloudfront/v4/home#/distributions` |
| 21 | IAM Roles | `https://us-east-1.console.aws.amazon.com/iam/home#/roles` |

---

## Opening (~1 minute)

### Narration

> "Hello everyone. Today we're going to walk through the cloud architecture implementation of UrbanMove — a Cloud Native Smart Mobility Management Platform built for a fictional city authority. Instead of focusing on what the application does, we'll focus on **how it's built on AWS** — the infrastructure decisions, the cloud services, and the architectural patterns that make this system production-ready."

### Screen Actions

1. Show the architecture diagram (`architecture.png`) full-screen
2. Briefly annotate the flow: Users → CloudFront → S3 → API Gateway → ALB → ECS Fargate → DynamoDB / Kinesis → Lambda → S3 Data Lake

### Talking Points

- This is a multi-tier, cloud-native architecture deployed entirely on AWS
- Every component is codified using Terraform — zero manual console configuration
- The system spans **13 Terraform files**, **4 DynamoDB tables**, **2 Lambda functions**, **2 S3 buckets**, and a full VPC with public/private subnets

---

## Scenario 1: Infrastructure-as-Code with Terraform (~4 minutes)

### Purpose
Demonstrate that the entire cloud infrastructure is reproducible, version-controlled, and automated.

### Narration

> "The foundation of our cloud architecture is Infrastructure-as-Code. Every single AWS resource — from the VPC to the CloudWatch alarms — is defined declaratively in Terraform. Let me show you the structure."

### Screen Actions

1. **Show the `infra/terraform/` directory** in the file explorer:
   ```
   infra/terraform/
   ├── vpc.tf              # VPC, subnets, NAT gateways, security groups, VPC endpoints
   ├── ecs.tf              # ECS Fargate cluster, task definition, service, auto-scaling
   ├── alb.tf              # Application Load Balancer, target group, listeners
   ├── api_gateway.tf      # HTTP API Gateway v2, VPC Link, Cognito authorizer, routes
   ├── cognito.tf          # User pool, MFA, groups, app client
   ├── dynamodb.tf         # 4 tables with GSIs, PITR, SSE-KMS
   ├── kinesis.tf          # 2-shard stream with KMS encryption
   ├── lambda.tf           # Processor + analytics Lambda functions
   ├── s3.tf               # Frontend hosting + data lake with lifecycle policies
   ├── cloudwatch.tf       # Dashboard, alarms (5xx, CPU, Lambda errors)
   └── variables.tf        # Project-wide configuration
   ```

2. **Open `variables.tf`** — show the parameterized configuration:
   ```hcl
   variable "project_name"    { default = "urbanmove" }
   variable "aws_region"      { default = "us-east-1" }
   variable "environment"     { default = "production" }
   variable "container_image" { description = "ECR image URI" }
   ```

3. **Run in terminal** (or show pre-recorded):
   ```bash
   cd infra/terraform
   terraform plan -var="container_image=<ECR_URI>"
   ```
   Show the plan output highlighting the ~30+ resources that would be created.

### 🌐 AWS Console Steps

4. **Switch to browser → AWS Console → Resource Groups** (`https://us-east-1.console.aws.amazon.com/resource-groups/home`):
   > "Now let me switch to the AWS Console to prove that every resource you see in the Terraform code actually exists in our AWS account."
   - Create or show a **Tag Editor** search filtered by `Tag: Project = urbanmove`
   - Point out the list of all deployed resources — this proves the IaC matches reality

5. **Navigate to any service** (e.g. DynamoDB Tables tab) and show the `urbanmove` tag on a table:
   > "Every single resource is tagged with the project name. This is critical for cost allocation — we can track exactly how much UrbanMove costs per month."

### Talking Points

- **13 Terraform files** cover every layer of the architecture
- `terraform plan` previews all changes before applying — safe, auditable deployments
- The same code can spin up identical environments for dev, staging, and production
- All resources are tagged with `Project = "urbanmove"` for cost tracking
- Infrastructure changes go through the same Git pull request workflow as application code

---

## Scenario 2: Containerized Deployment on ECS Fargate (~4 minutes)

### Purpose
Show how the backend API is containerized and deployed as a serverless container on AWS ECS Fargate.

### Narration

> "Our backend runs as a containerized Node.js API on ECS Fargate. Fargate is serverless — we don't manage any EC2 instances. Let me walk through the deployment pipeline."

### Screen Actions

1. **Open `backend/Dockerfile`** — highlight the multi-stage build:
   ```dockerfile
   # Stage 1: Development
   FROM node:20-alpine AS development
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   CMD ["node", "src/app.js"]

   # Stage 2: Production
   FROM node:20-alpine AS production
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY src/ ./src/
   CMD ["node", "src/app.js"]
   ```

2. **Open `ecs.tf`** — walk through the key sections:
   - **Cluster** with Container Insights enabled
   - **Capacity providers**: 70% Fargate / 30% Fargate Spot (cost optimization)
   - **Task definition**: 512 CPU, 1024 MB memory, awsvpc network mode
   - **IAM Roles**: Separate execution role vs. task role (principle of least privilege)
   - **Service**: desired count = 2, rolling deployment (100% min healthy, 200% max)
   - **Health check**: `wget -qO- http://localhost:3000/health`

3. **Show the ECS task policy** (`ecs_task_policy`):
   ```
   ✅ DynamoDB: PutItem, GetItem, Query, Scan, UpdateItem, DeleteItem (scoped to 4 tables + indexes)
   ✅ Kinesis: PutRecord, PutRecords (scoped to telemetry stream)
   ✅ CloudWatch Logs: CreateLogStream, PutLogEvents (scoped to ECS log group)
   ❌ No S3 access, no IAM modification — least privilege enforced
   ```

4. **Open `docker-compose.yml`** — show the local development equivalent:
   - `localstack` simulates DynamoDB, Kinesis, S3, Cognito
   - `backend` connects to LocalStack endpoints
   - `simulator` generates 20 virtual vehicles every 2 seconds

### 🌐 AWS Console Steps

5. **Switch to browser → ECS Clusters** (Tab 5):
   > "Let me show you the live ECS cluster in the AWS Console."
   - Click on `urbanmove-cluster` → show **Cluster overview**: running tasks count, pending tasks, Container Insights status
   - Click **Services** tab → show `urbanmove-api-service` with desired count = 2, running count = 2

6. **Click into the Service** → **Tasks** tab:
   - Show the 2 running tasks distributed across different Availability Zones
   - Click on a task → show **Task detail**: task definition revision, launch type (FARGATE), CPU/memory, private IP (no public IP)
   - Scroll to **Containers** section → show container health status: `HEALTHY`

7. **Click the Service → Deployments** tab:
   > "Here you can see the deployment history. The rolling deployment strategy ensures zero downtime."
   - Show deployment status: PRIMARY with `deployment_minimum_healthy_percent = 100`

8. **Navigate to ECR** (Tab 8):
   - Show the `urbanmove-api` repository
   - Click into it → show the pushed Docker image with tag, size, and push date
   > "This is the container image that ECS pulls. It was built from our multi-stage Dockerfile and pushed via CI."

### Talking Points

- **Serverless containers**: No OS patching, no instance management
- **Fargate Spot**: 30% of tasks run on Spot capacity — up to 70% cost savings
- **Rolling deployments**: Zero downtime — new tasks are healthy before old ones are drained
- **Local development parity**: `docker-compose` mirrors the production architecture using LocalStack
- The task definition injects all configuration via environment variables — no secrets in code

---

## Scenario 3: VPC Networking & Security Zones (~3 minutes)

### Purpose
Demonstrate the network isolation and security architecture.

### Narration

> "Security starts at the network level. Our VPC is designed with strict isolation — the API containers never have public IP addresses and are only reachable through the load balancer."

### Screen Actions

1. **Open `vpc.tf`** — draw attention to the subnet layout:
   ```
   VPC: 10.0.0.0/16

   ┌── Public Subnets ────────────────────────┐
   │  10.0.1.0/24 (us-east-1a) — ALB, NAT GW  │
   │  10.0.2.0/24 (us-east-1b) — ALB, NAT GW  │
   └───────────────────────────────────────────┘
          │ (Security Group: only 80/443 inbound)
          ▼
   ┌── Private Subnets ───────────────────────┐
   │  10.0.11.0/24 (us-east-1a) — ECS Tasks   │
   │  10.0.12.0/24 (us-east-1b) — ECS Tasks   │
   └───────────────────────────────────────────┘
   ```

2. **Highlight the security groups**:
   - **ALB SG**: Allows 80/443 from `0.0.0.0/0` (internet)
   - **ECS SG**: Allows port 3000 **only from ALB SG** (not from internet)

3. **Show VPC Endpoints** (lines 157–171):
   - DynamoDB Gateway Endpoint — traffic stays on AWS backbone, never touches internet
   - S3 Gateway Endpoint — same private connectivity
   - Both attached to private route tables only

4. **Show NAT Gateways** — one per AZ for high availability:
   - Private subnets can reach the internet (for Docker pulls, etc.) via NAT
   - But internet cannot reach private subnets

5. **Open `api_gateway.tf`** — show the VPC Link:
   ```hcl
   resource "aws_apigatewayv2_vpc_link" "main" {
     name               = "urbanmove-vpclink"
     security_group_ids = [aws_security_group.ecs.id]
     subnet_ids         = [private_a, private_b]
   }
   ```
   > "API Gateway connects to the ALB through a VPC Link — the traffic never traverses the public internet."

### 🌐 AWS Console Steps

6. **Switch to browser → VPC Dashboard** (Tab 1):
   > "Let's verify the VPC design in the AWS Console."
   - Click on the `urbanmove-vpc` → show CIDR `10.0.0.0/16`, DNS hostnames enabled

7. **Navigate to Subnets** (Tab 2):
   - Filter by VPC = `urbanmove-vpc`
   - Point out the 4 subnets and their tags: `Tier = Public` vs `Tier = Private`
   - Show AZ distribution: 2 subnets in `us-east-1a`, 2 in `us-east-1b`
   > "Notice the public subnets have 'Auto-assign public IP' enabled, but the private subnets do not."

8. **Navigate to Security Groups** (Tab 3):
   - Click `urbanmove-alb-sg` → **Inbound rules**: port 80 and 443 from `0.0.0.0/0`
   - Click `urbanmove-ecs-sg` → **Inbound rules**: port 3000 from **source = `urbanmove-alb-sg`**
   > "This is security group chaining — the ECS containers only accept traffic from the ALB, never from the internet directly."

9. **Navigate to VPC Endpoints** (Tab 4):
   - Show the DynamoDB and S3 Gateway endpoints
   - Click on one → show it's attached to the private route tables
   > "These endpoints mean our ECS tasks access DynamoDB and S3 over the AWS private backbone — the data never touches the public internet."

10. **Navigate to ALB** (Tab 9):
    - Show the load balancer in public subnets, across 2 AZs
    - Click **Listeners** → show HTTP:80 redirect to HTTPS:443
    - Click **Target Groups** (Tab 10) → show the 2 healthy targets (ECS task IPs)
    > "Both targets are healthy. If one fails the health check, the ALB stops routing to it automatically."

### Talking Points

- **Defense in depth**: Internet → API Gateway → VPC Link → ALB (public subnet) → ECS (private subnet)
- **No public IPs** on ECS tasks — `assign_public_ip = false`
- **VPC Endpoints** for DynamoDB and S3 eliminate data exfiltration risk — traffic stays on AWS backbone
- **Multi-AZ**: NAT gateways, subnets, and ECS tasks are distributed across 2 Availability Zones

---

## Scenario 4: Real-Time Data Streaming Pipeline (~4 minutes)

### Purpose
Show the event-driven data pipeline: Kinesis → Lambda → DynamoDB + S3 Data Lake.

### Narration

> "Now let's look at how we handle real-time mobility data at scale. When a vehicle sends GPS telemetry, it doesn't go straight to the database. Instead, it enters a streaming pipeline."

### Screen Actions

1. **Draw the data flow on screen** (or use the architecture diagram zoomed in):
   ```
   Vehicle GPS  →  API (ECS)  →  Kinesis Data Stream (2 shards, KMS encrypted)
                                        │
                                        ▼
                                  Lambda Processor (batch_size=100)
                                   ├── DynamoDB (Telemetry table)
                                   └── S3 Data Lake (archived JSON)
   ```

2. **Open `kinesis.tf`**:
   - 2 provisioned shards (2 MB/s write, 4 MB/s read)
   - 24-hour retention
   - KMS encryption at rest (`alias/aws/kinesis`)

3. **Open `lambda.tf`** — show the Kinesis trigger configuration:
   ```hcl
   batch_size                    = 100
   parallelization_factor        = 2
   bisect_batch_on_function_error = true
   maximum_retry_attempts        = 3
   ```
   > "This is production-grade: if a batch fails, Lambda bisects it to find the poisoned record instead of retrying the entire batch."

4. **Open `lambda/processor/index.js`** — briefly show it:
   - Decodes base64 Kinesis records
   - Batch writes to DynamoDB Telemetry table
   - Archives raw records to S3 in JSON format

5. **Show the Analytics Lambda** in `lambda.tf`:
   - Triggered by EventBridge every 5 minutes
   - Computes zone metrics, hourly activity, fleet utilization
   - Results stored back in DynamoDB for the analytics API

6. **Open `dynamodb.tf`** — highlight the Telemetry table design:
   ```
   Hash Key:  vehicleId (String)
   Range Key: timestamp (Number)
   GSI:       zone-index (zone → timestamp)
   TTL:       enabled (auto-expire old records)
   PITR:      enabled (point-in-time recovery)
   SSE:       KMS encryption at rest
   ```

7. **Show the S3 Data Lake lifecycle** in `s3.tf`:
   ```
   Day 0–30:   STANDARD
   Day 30–90:  STANDARD_IA (Infrequent Access)
   Day 90–365: GLACIER (archival)
   Day 365+:   EXPIRED (deleted)
   ```

### 🌐 AWS Console Steps

8. **Switch to browser → Kinesis Streams** (Tab 14):
   > "Let's see the live streaming pipeline in the console."
   - Click `urbanmove-telemetry-stream` → show **Stream details**: 2 shards, encryption = KMS
   - Click **Monitoring** tab → show **Incoming Records** and **Incoming Bytes** graphs
   > "You can see data flowing in real-time from our vehicle simulator."

9. **Navigate to Lambda Functions** (Tab 15):
   - Click `urbanmove-telemetry-processor` → show **Configuration**:
     - Runtime: Node.js 20.x, Memory: 256 MB, Timeout: 60s
   - Click **Triggers** → show the Kinesis trigger with batch size = 100
   - Click **Monitoring** tab → show **Invocations**, **Duration**, and **Error count** graphs
   > "The processor is being invoked automatically whenever new records arrive in Kinesis."
   - Then click `urbanmove-analytics-aggregator` → show the **EventBridge trigger** (every 5 min)

10. **Navigate to DynamoDB Tables** (Tab 13):
    - Click `Telemetry` table → **Overview** tab: show partition key, sort key, GSI
    - Click **Indexes** tab → show `zone-index` GSI
    - Click **Backups** tab → show **Point-in-time recovery: Enabled**
    - Click **Additional settings** → show **Encryption: AWS owned key**
    - Click **Explore items** → show live telemetry records with vehicleId, timestamp, lat, lng, speed
    > "These records were written by the Lambda processor. Each row is a GPS event from a simulated vehicle."

11. **Navigate to S3 Buckets** (Tab 16):
    - Click `urbanmove-datalake-*` bucket → browse the archived telemetry JSON files
    - Click **Management** tab → show the **Lifecycle rule**: Standard → IA (30d) → Glacier (90d) → Expire (365d)
    > "This is our cold storage layer. Older data automatically moves to cheaper storage classes."

### Talking Points

- **Decoupled ingestion**: API doesn't wait for database writes — fire-and-forget to Kinesis
- **Automatic scaling**: Kinesis can switch to ON_DEMAND mode for unpredictable traffic
- **Dual-write pattern**: Hot data in DynamoDB, cold data archived to S3 Data Lake
- **Cost-optimized storage**: S3 lifecycle transitions reduce storage costs by ~80% after 90 days
- **Fault tolerance**: bisect-on-error, retry limits, and DLQ-ready configuration

---

## Scenario 5: Observability & Monitoring (~3 minutes)

### Purpose
Show the integrated monitoring, logging, and alerting infrastructure.

### Narration

> "A production system without observability is flying blind. Let me show you the monitoring stack we've built into the infrastructure from day one."

### Screen Actions

1. **Open `cloudwatch.tf`** — walk through the dashboard definition:
   ```
   CloudWatch Dashboard: "urbanmove-dashboard"
   ┌────────────────────────────────┬────────────────────────────────┐
   │  API Request Count (per min)   │  API Latency P99               │
   ├──────────────┬─────────────────┼────────────────────────────────┤
   │  ECS CPU     │  Kinesis        │  DynamoDB Write                │
   │  Utilization │  Incoming       │  Capacity Units                │
   │              │  Records        │  (Telemetry + Vehicles)        │
   └──────────────┴─────────────────┴────────────────────────────────┘
   ```

2. **Show the 3 CloudWatch Alarms**:

   | Alarm | Metric | Threshold | Evaluation |
   |-------|--------|-----------|------------|
   | `api-5xx-errors` | API Gateway 5XXError | > 10 in 2 periods | 2 × 60s |
   | `ecs-cpu-high` | ECS CPUUtilization | > 85% avg | 3 × 60s |
   | `lambda-processor-errors` | Lambda Errors | > 5 in 1 period | 1 × 300s |

3. **Show log groups** created by Terraform:
   ```
   /ecs/urbanmove/api               — ECS container logs (30-day retention)
   /aws/lambda/urbanmove-processor  — Kinesis processor logs (14-day retention)
   /aws/lambda/urbanmove-analytics  — Analytics aggregator logs (14-day retention)
   /aws/apigateway/urbanmove        — API Gateway access logs (30-day retention)
   /aws/cloudfront/urbanmove        — CloudFront distribution logs (30-day retention)
   ```

4. **Show the API Gateway access log format** in `api_gateway.tf`:
   ```
   $context.identity.sourceIp - [$context.requestTime] "$context.httpMethod $context.routeKey" $context.status $context.responseLength $context.requestId
   ```

5. **Show ECS Container Insights** enabled in `ecs.tf`:
   ```hcl
   setting {
     name  = "containerInsights"
     value = "enabled"
   }
   ```

### 🌐 AWS Console Steps

6. **Switch to browser → CloudWatch Dashboard** (Tab 17):
   > "This is the live CloudWatch dashboard created by Terraform. Let me walk through each widget."
   - Point to **API Request Count** widget → show requests per minute
   - Point to **API Latency P99** widget → show response time distribution
   - Point to **ECS CPU Utilization** widget → show current CPU % across tasks
   - Point to **Kinesis Incoming Records** → show streaming throughput
   - Point to **DynamoDB Write Capacity** → show write consumption for Telemetry table
   > "All five widgets update in real-time. This single dashboard gives operators a complete system overview."

7. **Navigate to CloudWatch Alarms** (Tab 18):
   - Show the 3 alarms: `urbanmove-api-5xx-errors`, `urbanmove-ecs-cpu-high`, `urbanmove-lambda-processor-errors`
   - Click on `urbanmove-ecs-cpu-high` → show the **alarm graph**, threshold line at 85%, and evaluation period
   > "When CPU stays above 85% for 3 consecutive minutes, this alarm fires. You could connect it to SNS for email or Slack notifications."
   - Show current state: `OK` / `INSUFFICIENT_DATA` / `IN ALARM`

8. **Navigate to CloudWatch Log Groups** (Tab 19):
   - Show the 5 log groups with their retention policies
   - Click `/ecs/urbanmove/api` → click a recent **Log stream** → show live application logs (request logs, startup messages)
   > "These are the live container logs from our ECS tasks — the same output you'd see with `docker logs`, but persisted and searchable."
   - Click `/aws/lambda/urbanmove-processor` → show a recent Lambda invocation log with batch processing output

### Talking Points

- **5 log groups** with differentiated retention policies (cost vs. compliance)
- **3 automated alarms** covering the critical failure modes: API errors, compute saturation, and data pipeline failures
- **Container Insights** provides CPU, memory, network, and disk metrics per ECS task
- **Access logging** on API Gateway enables request tracing and audit trails
- All monitoring is deployed alongside infrastructure — not added as an afterthought

---

## Scenario 6: Security Architecture (~4 minutes)

### Purpose
Demonstrate the multi-layered security design: authentication, authorization, encryption, and network protection.

### Narration

> "Security is not a single feature — it's an architecture property. Let me walk through the six security layers we've implemented."

### Screen Actions

1. **Layer 1 — Authentication (Cognito)**
   Open `cognito.tf`:
   - User pool with email-based login
   - Password policy: 8+ chars, uppercase, numbers, symbols
   - Optional MFA via TOTP
   - 3 user groups: Admin (precedence 1), Operator (2), Viewer (3)
   - Token validity: 8h access, 30d refresh
   - `prevent_user_existence_errors = "ENABLED"` — prevents user enumeration attacks

2. **Layer 2 — API Authorization (JWT Authorizer)**
   Open `api_gateway.tf`:
   ```hcl
   resource "aws_apigatewayv2_authorizer" "cognito" {
     authorizer_type  = "JWT"
     identity_sources = ["$request.header.Authorization"]
     jwt_configuration {
       audience = [cognito_client_id]
       issuer   = "https://cognito-idp.us-east-1.amazonaws.com/<pool_id>"
     }
   }
   ```
   Show the route split:
   - **Public**: `/auth/*`, `/health`, `POST /telemetry`, `POST /alerts`
   - **Protected**: All vehicle, route, analytics, and alert management endpoints

3. **Layer 3 — IAM Least Privilege**
   Open `ecs.tf` task policy:
   - ECS tasks can only access the 4 specific DynamoDB tables + their indexes
   - Can only PutRecord to the specific Kinesis stream
   - Cannot access S3, IAM, or any other AWS service

4. **Layer 4 — Network Isolation**
   Recap the VPC design:
   - ECS in private subnets, ALB in public subnets
   - Security group chaining: ECS only accepts traffic from ALB
   - VPC Endpoints for DynamoDB/S3

5. **Layer 5 — Encryption**
   Show across the Terraform files:
   - **DynamoDB**: `server_side_encryption { enabled = true }` (SSE-KMS)
   - **Kinesis**: `encryption_type = "KMS"`, `kms_key_id = "alias/aws/kinesis"`
   - **S3**: Default encryption enabled
   - **CloudFront**: `viewer_protocol_policy = "redirect-to-https"`
   - **ALB**: HTTP → HTTPS redirect (port 80 → 443)

6. **Layer 6 — API Protection**
   Show in `api_gateway.tf`:
   ```hcl
   default_route_settings {
     throttling_burst_limit = 1000
     throttling_rate_limit  = 500
   }
   ```

### Security Summary Table (show on screen)

| Layer | Implementation | Terraform File |
|-------|---------------|----------------|
| Authentication | Cognito User Pool + MFA | `cognito.tf` |
| Authorization | JWT Authorizer on API Gateway | `api_gateway.tf` |
| IAM | Scoped task/execution roles | `ecs.tf` |
| Network | Public/private subnets, SGs, VPC Endpoints | `vpc.tf` |
| Encryption | KMS on DynamoDB, Kinesis, S3; HTTPS enforced | `dynamodb.tf`, `kinesis.tf`, `s3.tf` |
| Rate Limiting | API Gateway throttling (500 req/s, burst 1000) | `api_gateway.tf` |

### 🌐 AWS Console Steps

7. **Switch to browser → Cognito User Pools** (Tab 12):
   > "Let's verify the authentication layer in the console."
   - Click the `urbanmove-user-pool` → **Sign-in experience** tab:
     - Show sign-in with email, MFA = Optional (TOTP)
   - Click **Security** tab → show password policy (8+ chars, uppercase, numbers, symbols)
   - Click **Groups** tab → show the 3 groups: Admin, Operator, Viewer with precedence values
   - Click **Users** tab → show registered users and their group membership
   - Click **App integration** tab → show the app client and hosted UI domain
   > "Cognito handles all user management — registration, login, password reset, MFA — so our application code doesn't need to."

8. **Navigate to API Gateway** (Tab 11):
   - Click `urbanmove-api` → **Authorization** section:
     - Show the `cognito-authorizer` with JWT configuration
   - Click **Routes** → show the route table:
     - Point out public routes (no authorizer): `/auth/{proxy+}`, `/health`
     - Point out protected routes (with Cognito authorizer): `/vehicles`, `/analytics/*`, etc.
   - Click **Stages** → show `$default` stage with throttling: burst = 1000, rate = 500
   > "The API Gateway acts as the front door — it validates JWTs and enforces rate limits before any request reaches our containers."
   - Click **VPC Links** → show the VPC Link connecting to the private subnets

9. **Navigate to IAM Roles** (Tab 21):
   - Search for `urbanmove` → show the 3 roles:
     - `urbanmove-ecs-task-execution` — pulls images, writes logs
     - `urbanmove-ecs-task` — app permissions (DynamoDB, Kinesis)
     - `urbanmove-lambda-role` — Lambda permissions
   - Click `urbanmove-ecs-task` → show the **inline policy** with scoped DynamoDB/Kinesis permissions
   > "Each role follows least privilege — the ECS task role can only access the 4 DynamoDB tables and the Kinesis stream. Nothing else."

### Talking Points

- Every security control is codified — no manual console configuration that could drift
- Defense in depth: compromise of one layer doesn't expose the entire system
- User enumeration protection prevents attackers from discovering valid email addresses
- Encryption covers data at rest (KMS) and in transit (HTTPS/TLS)

---

## Scenario 7: Scalability, High Availability & Cost Optimization (~3 minutes)

### Purpose
Show the auto-scaling configuration, multi-AZ deployment, disaster recovery, and cost optimization strategies.

### Narration

> "The final pillar is making sure this architecture can grow, survive failures, and remain cost-efficient. Let me show the three mechanisms we've built in."

### Screen Actions

1. **Auto-Scaling** — Open `ecs.tf` (lines 182–205):
   ```hcl
   resource "aws_appautoscaling_target" "ecs" {
     min_capacity = 2     # Always at least 2 tasks running
     max_capacity = 10    # Scale up to 10 under load
   }

   resource "aws_appautoscaling_policy" "cpu" {
     target_value = 70.0  # Target 70% CPU utilization
     scale_in_cooldown  = 300   # Wait 5 min before scaling down
     scale_out_cooldown = 60    # Scale up quickly (1 min)
   }
   ```

   **Explain the scaling behavior:**
   ```
   Load ↑ → CPU > 70% for 60s → Add ECS task → Up to 10 tasks
   Load ↓ → CPU < 70% for 300s → Remove ECS task → Down to 2 tasks
   ```

2. **High Availability** — Summarize the multi-AZ design:
   ```
   Availability Zone A              Availability Zone B
   ┌──────────────────┐             ┌──────────────────┐
   │ Public Subnet    │             │ Public Subnet    │
   │  ALB node        │             │  ALB node        │
   │  NAT Gateway     │             │  NAT Gateway     │
   ├──────────────────┤             ├──────────────────┤
   │ Private Subnet   │             │ Private Subnet   │
   │  ECS Task #1     │             │  ECS Task #2     │
   └──────────────────┘             └──────────────────┘
   ```
   - If AZ-A goes down, AZ-B continues serving traffic
   - ALB automatically routes to healthy tasks only
   - DynamoDB is multi-AZ by default (managed service)

3. **Cost Optimization** — Show the strategies in the Terraform code:

   | Strategy | Implementation | Savings |
   |----------|---------------|---------|
   | Fargate Spot | 30% tasks on Spot capacity | ~70% on those tasks |
   | DynamoDB On-Demand | PAY_PER_REQUEST billing | No idle capacity cost |
   | S3 Lifecycle | STANDARD → IA → Glacier → Expire | ~80% storage savings |
   | CloudFront Caching | `PriceClass_100` (cheapest edge locations) | Reduced origin requests |
   | NAT Gateway per AZ | Already optimized — 2 NATs for HA | Cross-AZ traffic savings |

4. **Disaster Recovery** — Show built-in backup mechanisms:
   - DynamoDB PITR enabled on all 4 tables (`point_in_time_recovery { enabled = true }`)
   - S3 versioning enabled on frontend and data lake buckets
   - Terraform state can recreate the entire infrastructure
   - RPO: ~1 second (PITR), RTO: ~15 minutes (Terraform apply)

### 🌐 AWS Console Steps

5. **Switch to browser → ECS Service** (Tab 6):
   > "Let me show the auto-scaling configuration live."
   - Click `urbanmove-api-service` → **Auto Scaling** tab
   - Show the scaling policy: target = 70% CPU, min = 2, max = 10
   - Show current task count and scaling activity history
   > "Right now we have 2 tasks. If CPU exceeds 70%, ECS will automatically launch new tasks — up to 10."

6. **Navigate to ECS Tasks** (Tab 7):
   - Show that the 2 running tasks are in **different Availability Zones**
   > "This is high availability — if one AZ fails, the other task keeps serving traffic."

7. **Navigate to CloudFront** (Tab 20):
   - Click the distribution → show **General** tab:
     - Price class: `PriceClass_100` (North America and Europe — cheapest)
     - Default root object: `index.html`
     - Viewer protocol policy: `redirect-to-https`
   - Click **Origins** tab → show the S3 origin with OAC (Origin Access Control)
   > "CloudFront caches static assets at edge locations globally. The S3 bucket is completely private — only CloudFront can access it."

8. **Navigate to DynamoDB Tables** (Tab 13):
   - Click any table → **Backups** tab → show **Point-in-time recovery: Enabled**
   > "We can restore this table to any second within the last 35 days. That gives us an RPO of effectively zero."

9. **Navigate to S3** (Tab 16):
   - Click `urbanmove-frontend-*` bucket → **Properties** tab → show **Versioning: Enabled**
   - Show **Versions** toggle on the Objects tab → display previous versions of deployed files
   > "Even if we deploy a broken frontend, we can instantly roll back to any previous version."

### Talking Points

- **Asymmetric cooldowns**: Scale out fast (60s) but scale in slowly (300s) — prevents thrashing
- **Min count = 2**: Ensures at least one task per AZ at all times
- **DynamoDB on-demand**: Perfect for unpredictable traffic — pay only for what you use
- **Everything is rebuildable**: Terraform + container image + DynamoDB PITR = full recovery

---

## Closing (~1 minute)

### Narration

> "To summarize — this is a cloud-native architecture that addresses all six pillars required by the project specification:"

### Show Summary Slide

| Requirement | How We Address It |
|-------------|-------------------|
| **Scalability** | ECS auto-scaling (2–10 tasks), DynamoDB on-demand, Kinesis sharding |
| **High Availability** | Multi-AZ VPC, 2 NAT gateways, ALB health checks, rolling deployments |
| **Security** | Cognito JWT, IAM least privilege, private subnets, KMS encryption, rate limiting |
| **Cost Optimization** | Fargate Spot, S3 lifecycle, DynamoDB PAY_PER_REQUEST, CloudFront PriceClass_100 |
| **Observability** | CloudWatch dashboard, 3 alarms, 5 log groups, Container Insights, access logging |
| **Disaster Recovery** | DynamoDB PITR, S3 versioning, Terraform IaC, RPO ~1s / RTO ~15min |

> "Every single resource is codified in Terraform. The entire platform can be torn down with `terraform destroy` and rebuilt with `terraform apply` in under 15 minutes. That's the power of cloud-native, Infrastructure-as-Code architecture."

### Final Screen

Show the terminal running:
```bash
terraform plan | tail -5
# Plan: 35 to add, 0 to change, 0 to destroy.
```

> "Thank you. Any questions?"

---

## Appendix A: Quick Reference — Files + Console Tabs Per Scenario

| Scenario | Code Files | AWS Console Tabs |
|----------|-----------|------------------|
| 1. IaC | `variables.tf`, terminal | Resource Groups / Tag Editor |
| 2. Containers | `backend/Dockerfile`, `ecs.tf`, `docker-compose.yml` | ECS Clusters → Service → Tasks, ECR |
| 3. Networking | `vpc.tf`, `api_gateway.tf` | VPC, Subnets, Security Groups, Endpoints, ALB, Target Groups |
| 4. Streaming | `kinesis.tf`, `lambda.tf`, `dynamodb.tf`, `s3.tf` | Kinesis Streams, Lambda Functions, DynamoDB Tables, S3 Buckets |
| 5. Observability | `cloudwatch.tf`, `api_gateway.tf`, `ecs.tf` | CloudWatch Dashboard, Alarms, Log Groups |
| 6. Security | `cognito.tf`, `api_gateway.tf`, `ecs.tf` | Cognito User Pool, API Gateway Routes/Auth, IAM Roles |
| 7. Scalability | `ecs.tf`, `vpc.tf`, `s3.tf`, `dynamodb.tf` | ECS Auto Scaling, CloudFront, DynamoDB Backups, S3 Versioning |

## Appendix B: Demo Flow Tip

> For each scenario, follow the **Code → Console → Code** pattern:
> 1. **Show the Terraform code** to explain what was defined
> 2. **Switch to AWS Console** to prove it's live and show the visual representation
> 3. **Return to code** to highlight the specific configuration that created what you just showed
>
> This pattern reinforces the IaC story: everything in the console was created by Terraform.
