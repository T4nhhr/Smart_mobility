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

## Opening (~2 minutes)

### Sub-Timing
| Time | Action |
|------|--------|
| 0:00–0:30 | Show architecture diagram, introduce the project |
| 0:30–1:15 | Walk through the data flow on the diagram |
| 1:15–2:00 | Summarize the scope and transition to Scenario 1 |

### Narration

> "Hello everyone. Today we're going to walk through the cloud architecture implementation of **UrbanMove** — a Cloud Native Smart Mobility Management Platform built for a fictional city authority called UrbanMove."
>
> "Instead of focusing on the application features — dashboards, maps, vehicle tracking — we're going to focus entirely on **how the system is built on AWS**: the infrastructure decisions, the cloud services, and the architectural patterns that make this system production-ready, scalable, and secure."
>
> *(Show architecture diagram full-screen)*
>
> "Here is our production architecture. Let me walk you through the data flow. When a user opens the platform, their browser loads the React SPA from an **S3 bucket** served through **CloudFront** CDN. Every API call goes through **API Gateway**, which validates the user's JWT token using **AWS Cognito** before forwarding the request through a **VPC Link** to the **Application Load Balancer**. The ALB routes the request to one of our **ECS Fargate** containers running in a private subnet."
>
> "For real-time GPS data, the API publishes events to **Amazon Kinesis**, which triggers a **Lambda function** that writes to **DynamoDB** and archives the raw data to an **S3 Data Lake**. A second Lambda runs every 5 minutes to compute analytics. Everything is monitored by **CloudWatch**."
>
> "The entire system — all of this — is codified in **13 Terraform files**. There is zero manual console configuration. Let me show you."

### Screen Actions

1. **[0:00]** Show the architecture diagram (`architecture.png`) full-screen. Keep it visible while narrating.
2. **[0:30]** Use your cursor or annotation tool to trace the flow as you speak:
   - Start at "Users" → follow arrow to CloudFront → S3
   - Then trace API Gateway → VPC Link → ALB → ECS Fargate
   - Then trace Kinesis → Lambda → DynamoDB + S3 Data Lake
   - Point to CloudWatch at the bottom
3. **[1:15]** Leave the diagram on screen as you transition

### Talking Points

- This is a multi-tier, cloud-native architecture deployed entirely on AWS
- Every component is codified using Terraform — zero manual console configuration
- The system spans **13 Terraform files**, **4 DynamoDB tables**, **2 Lambda functions**, **2 S3 buckets**, and a full VPC with public/private subnets
- Emphasize: *"We will show both the code AND the live AWS Console for every component"*

### Transition

> "Let's start with the foundation — how all of this infrastructure is defined as code."

---

## Scenario 1: Infrastructure-as-Code with Terraform (~5 minutes)

### Sub-Timing
| Time | Action |
|------|--------|
| 0:00–1:00 | Show Terraform directory structure and explain each file |
| 1:00–2:00 | Open `variables.tf`, explain parameterization |
| 2:00–3:00 | Run `terraform plan` in terminal, walk through output |
| 3:00–4:00 | Switch to AWS Console → Resource Groups / Tag Editor |
| 4:00–5:00 | Show tags on a DynamoDB table, transition to Scenario 2 |

### Purpose
Demonstrate that the entire cloud infrastructure is reproducible, version-controlled, and automated.

### Narration

> "The foundation of our cloud architecture is Infrastructure-as-Code. Every single AWS resource — from the VPC to the CloudWatch alarms — is defined declaratively in Terraform using HashiCorp Configuration Language."
>
> "What this means in practice is that we can destroy this entire platform with one command and rebuild it identically in 15 minutes. There is no clicking through the AWS Console — everything is automated, version-controlled in Git, and goes through code review before deployment."
>
> "Let me show you the structure."

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

- **Key phrase to say:** *"If it's not in Terraform, it doesn't exist. Every resource you'll see in the AWS Console today was created by these files."*
- **13 Terraform files** cover every layer of the architecture
- `terraform plan` previews all changes before applying — safe, auditable deployments
- The same code can spin up identical environments for dev, staging, and production
- All resources are tagged with `Project = "urbanmove"` for cost tracking
- Infrastructure changes go through the same Git pull request workflow as application code

---

### Transition

> "Now that we've seen how the infrastructure is defined, let's zoom into the compute layer — how our application code gets packaged and deployed."

---

## Scenario 2: Containerized Deployment on ECS Fargate (~5 minutes)

### Sub-Timing
| Time | Action |
|------|--------|
| 0:00–1:00 | Show Dockerfile, explain multi-stage build |
| 1:00–2:00 | Open `ecs.tf`, explain cluster/task definition/service |
| 2:00–2:30 | Show IAM task policy (least privilege) |
| 2:30–3:00 | Show `docker-compose.yml` local parity |
| 3:00–4:00 | AWS Console: ECS Cluster → Service → Tasks |
| 4:00–5:00 | AWS Console: ECR repository, deployments tab |

### Purpose
Show how the backend API is containerized and deployed as a serverless container on AWS ECS Fargate.

### Narration

> "Our backend API is a Node.js Express application. But we don't deploy it directly — we containerize it using Docker and run it on **AWS ECS Fargate**."
>
> "Fargate is serverless compute for containers. Unlike traditional EC2, we don't provision or manage any virtual machines. We just define how much CPU and memory we need, and AWS handles the rest — patching, scaling, and host management."
>
> "Let me walk through the deployment pipeline, starting with the Dockerfile."

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
   ✅ Kinesis: PutRecord, PutRecords (scoped to the single telemetry stream ARN)
   ✅ CloudWatch Logs: CreateLogStream, PutLogEvents (scoped to ECS log group ARN)
   ❌ No S3 access, no IAM modification — least privilege enforced
   ```

4. **Open `docker-compose.yml`** — show the local development equivalent:
   - `localstack` simulates DynamoDB, Kinesis, S3, Cognito
   - `backend` connects to LocalStack endpoints
   - `simulator` generates 20 virtual vehicles every 2 seconds

### 🌐 AWS Console Steps

5. **Switch to browser → ECS Clusters** (Tab 5):
   > "Now let me switch to the AWS Console to show you this cluster running live."
   > *(Switch to browser, click Tab 5)*
   - Click on `urbanmove-cluster` → show **Cluster overview**: running tasks count, pending tasks, Container Insights status
   - Click **Services** tab → show `urbanmove-api-service` with desired count = 2, running count = 2

6. **Click into the Service** → click **Tasks** tab:
   > "You can see 2 tasks running. Let me click into one."
   - Show the 2 running tasks — point out the **different Availability Zone** assignments (e.g., `us-east-1a` and `us-east-1b`)
   - Click on a task → show **Task detail** page:
     - Point to: Task definition revision, Launch type = `FARGATE`, CPU = 512, Memory = 1024
     - Point to: **Private IP** (e.g., `10.0.11.x`) — emphasize there is **no public IP**
     > "Notice this task has a private IP in the 10.0.11.x range — that's our private subnet. There is no public IP. This container is completely unreachable from the internet directly."
   - Scroll to **Containers** section → show container health status: `HEALTHY`

7. **Click the Service → Deployments** tab:
   > "Here you can see the deployment history. The rolling deployment strategy ensures zero downtime."
   - Show deployment status: PRIMARY with `deployment_minimum_healthy_percent = 100`

8. **Navigate to ECR** (Tab 8):
   > *(Click Tab 8)*
   - Show the `urbanmove-api` repository in the list
   - Click into it → show the image list with columns: **Image tag** (`latest`), **Size** (~80 MB), **Pushed at** (date)
   > "This is the Docker image that ECS pulls when it launches a task. It was built from our multi-stage Dockerfile. Notice the size — about 80 MB. That's because the production stage only includes production dependencies, not devDependencies."
   > "When we push a new image and update the task definition, ECS performs a rolling deployment — launching new tasks with the new image before draining the old ones."

### Talking Points

- **Serverless containers**: No OS patching, no instance management
- **Fargate Spot**: 30% of tasks run on Spot capacity — up to 70% cost savings
- **Rolling deployments**: Zero downtime — new tasks are healthy before old ones are drained
- **Local development parity**: `docker-compose` mirrors the production architecture using LocalStack
- The task definition injects all configuration via environment variables — no secrets in code

### Transition

> "Now let's look at the network that all of this runs inside — the VPC."

---

## Scenario 3: VPC Networking & Security Zones (~5 minutes)

### Sub-Timing
| Time | Action |
|------|--------|
| 0:00–1:00 | Show `vpc.tf` subnet layout and explain public vs private |
| 1:00–1:30 | Explain security groups and SG chaining |
| 1:30–2:00 | Show VPC Endpoints and NAT Gateways in code |
| 2:00–2:30 | Show VPC Link in `api_gateway.tf` |
| 2:30–3:15 | AWS Console: VPC → Subnets → show public vs private |
| 3:15–4:00 | AWS Console: Security Groups → show SG chaining |
| 4:00–4:30 | AWS Console: VPC Endpoints |
| 4:30–5:00 | AWS Console: ALB → Target Groups → healthy targets |

### Purpose
Demonstrate the network isolation and security architecture.

### Narration

> "Security starts at the network level. Let me show you how our Virtual Private Cloud is designed."
>
> "The key principle here is **network isolation**. Our API containers run in private subnets — they have no public IP addresses and are completely unreachable from the internet. The only way to reach them is through the Application Load Balancer, which itself is only accessible through the API Gateway."
>
> "Let me show you the Terraform code first, then we'll verify it in the AWS Console."

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
   > "Now let's switch to the AWS Console to verify everything we just saw in the code."
   > *(Click Tab 1)*
   - Click on the `urbanmove-vpc` → show CIDR `10.0.0.0/16`, DNS hostnames enabled

7. **Navigate to Subnets** (Tab 2):
   - Filter by VPC = `urbanmove-vpc`
   - Point out the 4 subnets and their tags: `Tier = Public` vs `Tier = Private`
   - Show AZ distribution: 2 subnets in `us-east-1a`, 2 in `us-east-1b`
   > "Notice the public subnets have 'Auto-assign public IP' enabled, but the private subnets do not."

8. **Navigate to Security Groups** (Tab 3):
   > "Now this is the most important part of the network security."
   > *(Click Tab 3, filter by VPC = urbanmove-vpc)*
   - Click `urbanmove-alb-sg` → click **Inbound rules** tab → show: port 80 and 443 from `0.0.0.0/0`
   > "The ALB security group accepts traffic from anywhere on ports 80 and 443 — that's expected, it's the public entry point."
   - Now click `urbanmove-ecs-sg` → click **Inbound rules** tab → show: port 3000 from **source = `urbanmove-alb-sg`** (not `0.0.0.0/0`)
   > "Now look at the ECS security group. The source is NOT `0.0.0.0/0` — it's the ALB security group ID. This is called **security group chaining**. It means the ECS containers will only accept connections that come from the load balancer. Even if someone discovers the private IP of a container, they cannot connect to it directly."

9. **Navigate to VPC Endpoints** (Tab 4):
   - Show the DynamoDB and S3 Gateway endpoints
   - Click on one → show it's attached to the private route tables
   > "These endpoints mean our ECS tasks access DynamoDB and S3 over the AWS private backbone — the data never touches the public internet."

10. **Navigate to ALB** (Tab 9):
    - Show the load balancer in public subnets, across 2 AZs
    - Click **Listeners** → show HTTP:80 redirect to HTTPS:443
    - Click **Target Groups** (Tab 10) → show the 2 registered targets with status `healthy`
    - Point to the target IPs: they are private IPs (e.g., `10.0.11.47`, `10.0.12.23`)
    > "Both targets are healthy. Notice the IP addresses — they're in the 10.0.11.x and 10.0.12.x ranges, which are our two private subnets. The ALB performs health checks every 15 seconds on `/health`. If a target fails 3 consecutive checks, the ALB automatically stops routing traffic to it."

### Talking Points

- **Defense in depth**: Internet → API Gateway → VPC Link → ALB (public subnet) → ECS (private subnet)
- **No public IPs** on ECS tasks — `assign_public_ip = false`
- **VPC Endpoints** for DynamoDB and S3 eliminate data exfiltration risk — traffic stays on AWS backbone
- **Multi-AZ**: NAT gateways, subnets, and ECS tasks are distributed across 2 Availability Zones

### Transition

> "Now that we understand the network, let's look at how data flows through the system — specifically the real-time streaming pipeline."

---

## Scenario 4: Real-Time Data Streaming Pipeline (~5 minutes)

### Sub-Timing
| Time | Action |
|------|--------|
| 0:00–0:30 | Show data flow diagram, explain decoupled architecture |
| 0:30–1:00 | Show `kinesis.tf` — shards, encryption, retention |
| 1:00–1:45 | Show `lambda.tf` — trigger config, bisect-on-error |
| 1:45–2:15 | Show `dynamodb.tf` — table design, GSI, TTL, PITR |
| 2:15–2:45 | Show `s3.tf` — lifecycle policy |
| 2:45–3:30 | AWS Console: Kinesis stream details + monitoring |
| 3:30–4:15 | AWS Console: Lambda functions + triggers + invocations |
| 4:15–5:00 | AWS Console: DynamoDB items + S3 lifecycle rule |

### Purpose
Show the event-driven data pipeline: Kinesis → Lambda → DynamoDB + S3 Data Lake.

### Narration

> "Now let's look at the data layer — specifically how we handle real-time GPS telemetry at scale."
>
> "When a vehicle sends its GPS coordinates to our API, the data does NOT go straight to the database. That would create a tight coupling and a bottleneck. Instead, the API publishes the event to **Amazon Kinesis Data Streams**, which acts as a buffer. A **Lambda function** is triggered automatically to process the data in batches and write it to both **DynamoDB** for hot queries and **S3** for long-term archival."
>
> "This is an event-driven, decoupled architecture. Let me show you the code."

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
   > "Pay attention to these four settings — this is what separates a prototype from production. The `batch_size` of 100 means Lambda processes up to 100 records at once for efficiency. The `parallelization_factor` of 2 means Lambda can process 2 batches per shard concurrently. And crucially, `bisect_batch_on_function_error` means if a batch fails, Lambda splits it in half and retries each half separately — this isolates the one bad record without blocking the entire pipeline. And `maximum_retry_attempts` of 3 prevents infinite retry loops."

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
   - Click **Monitoring** tab → show 3 key graphs:
     - **Invocations**: shows how often Lambda is triggered (should be continuous)
     - **Duration**: shows processing time per batch (should be <1 second)
     - **Error count**: should be 0 in normal operation
   > "The processor is being invoked automatically every time new records arrive in Kinesis. You can see steady invocations here. Duration is under a second, and the error count is zero — the pipeline is healthy."
   - Click back, then click `urbanmove-analytics-aggregator` → show the **Triggers** section with **EventBridge rule** (`rate(5 minutes)`)
   > "This second Lambda is our analytics aggregator. It runs on a schedule — every 5 minutes — and computes fleet metrics like zone congestion and vehicle utilization."

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

- **Key phrase to say:** *"The API never waits for the database. It publishes to Kinesis and returns immediately. This gives us sub-50ms API response times for data ingestion."*
- **Decoupled ingestion**: API doesn't wait for database writes — fire-and-forget to Kinesis
- **Automatic scaling**: Kinesis can switch to ON_DEMAND mode for unpredictable traffic
- **Dual-write pattern**: Hot data in DynamoDB, cold data archived to S3 Data Lake
- **Cost-optimized storage**: S3 lifecycle transitions reduce storage costs by ~80% after 90 days
- **Fault tolerance**: bisect-on-error, retry limits, and DLQ-ready configuration

### Transition

> "We've seen how data flows through the system. But how do we know if something goes wrong? Let's look at observability."

---

## Scenario 5: Observability & Monitoring (~4 minutes)

### Sub-Timing
| Time | Action |
|------|--------|
| 0:00–0:45 | Show `cloudwatch.tf` dashboard definition and alarm configs |
| 0:45–1:15 | Show log groups and access log format in code |
| 1:15–1:30 | Show Container Insights in `ecs.tf` |
| 1:30–2:30 | AWS Console: CloudWatch Dashboard (walk through all 5 widgets live) |
| 2:30–3:15 | AWS Console: CloudWatch Alarms (show alarm graph and thresholds) |
| 3:15–4:00 | AWS Console: CloudWatch Logs (open live ECS and Lambda logs) |

### Purpose
Show the integrated monitoring, logging, and alerting infrastructure.

### Narration

> "A production system without observability is flying blind. You need to know at any moment: how many requests are coming in, how fast they're being processed, whether the pipeline is healthy, and whether any errors are occurring."
>
> "We've built a full observability stack using CloudWatch — dashboards for visualization, alarms for automated alerting, and log groups for debugging. And all of it is defined in Terraform, deployed alongside the infrastructure."
>
> "Let me show you the code first, then the live dashboard."

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
   > "Now let me switch to the AWS Console and show you the live dashboard."
   > *(Click Tab 17 — the dashboard should load immediately with all 5 widgets)*
   > "This dashboard was created entirely by Terraform — we defined every widget in `cloudwatch.tf`. Let me walk through each one."
   - **Top-left widget**: Point to **API Request Count** → hover to show per-minute request volume
   > "This shows how many API requests are hitting our system per minute. You can see the pattern — steady traffic from the simulator."
   - **Top-right widget**: Point to **API Latency P99** → show the 99th percentile response time
   > "P99 latency tells us the worst-case response time for 99% of requests. Anything under 200ms is good."
   - **Bottom-left widget**: Point to **ECS CPU Utilization** → show current percentage
   - Point to **Kinesis Incoming Records** → show streaming throughput
   - Point to **DynamoDB Write Capacity** → show write consumption for Telemetry table
   > "All five widgets update in real-time. This single dashboard gives operators a complete system overview."

7. **Navigate to CloudWatch Alarms** (Tab 18):
   > *(Click Tab 18)*
   - Show all 3 alarms in the list with their current state (green = OK, grey = INSUFFICIENT_DATA, red = IN ALARM)
   > "We have 3 automated alarms. Let me click into one to show you how they work."
   - Click on `urbanmove-ecs-cpu-high` → show the **alarm detail** page:
     - Point to the **graph** with the metric line and the **red threshold line at 85%**
     - Point to the **evaluation period**: 3 × 60 seconds
   > "This alarm monitors ECS CPU utilization. If the average CPU stays above 85% for 3 consecutive minutes, the alarm fires. Right now the state is OK because our CPU is well below 85%. In production, you would connect this to an SNS topic that sends email or Slack notifications to the ops team."
   - Click back → briefly click `urbanmove-api-5xx-errors` to show its threshold (>10 errors in 2 minutes)
   > "This one monitors server errors. If we get more than 10 HTTP 5xx responses in 2 minutes, something is seriously wrong."

8. **Navigate to CloudWatch Log Groups** (Tab 19):
   > *(Click Tab 19)*
   - Show the list of 5 log groups — point to the **Retention** column showing differentiated policies:
     - `/ecs/urbanmove/api` → 30 days
     - `/aws/lambda/urbanmove-processor` → 14 days
     - `/aws/lambda/urbanmove-analytics` → 14 days
     - `/aws/apigateway/urbanmove` → 30 days
     - `/aws/cloudfront/urbanmove` → 30 days
   > "Notice the different retention policies. ECS and API logs are kept for 30 days because they're needed for debugging and audit. Lambda logs are 14 days because they're higher volume but less critical for long-term retention. This is a cost optimization — CloudWatch charges per GB of log storage."
   - Click `/ecs/urbanmove/api` → click the most recent **Log stream** → show live log entries:
     - Point to startup messages (Express listening on port 3000)
     - Point to incoming request logs (method, path, status code, response time)
   > "These are the live container logs from our ECS tasks. You can see every API request being logged with its method, path, status code, and response time. This is the same output you'd see with `docker logs`, but it's persisted, searchable, and survives container restarts."
   - Click `/aws/lambda/urbanmove-processor` → show a recent Lambda invocation log with batch processing output

### Talking Points

- **5 log groups** with differentiated retention policies (cost vs. compliance)
- **3 automated alarms** covering the critical failure modes: API errors, compute saturation, and data pipeline failures
- **Container Insights** provides CPU, memory, network, and disk metrics per ECS task
- **Access logging** on API Gateway enables request tracing and audit trails
- All monitoring is deployed alongside infrastructure — not added as an afterthought
- **Key phrase to say:** *"Every metric, alarm, and log group you see in the console was created by `cloudwatch.tf`. If we tear down and redeploy, all of this monitoring comes back automatically."*

### Transition

> "Now let's look at security — how we protect the system at every layer."

---

## Scenario 6: Security Architecture (~5 minutes)

### Sub-Timing
| Time | Action |
|------|--------|
| 0:00–0:45 | Show `cognito.tf` — user pool, MFA, groups |
| 0:45–1:15 | Show `api_gateway.tf` — JWT authorizer, route split |
| 1:15–1:45 | Show `ecs.tf` — IAM task policy (least privilege) |
| 1:45–2:15 | Recap VPC isolation + show encryption across files |
| 2:15–2:45 | Show rate limiting config + security summary table |
| 2:45–3:30 | AWS Console: Cognito User Pool (groups, MFA, password policy) |
| 3:30–4:15 | AWS Console: API Gateway (routes, authorizer, throttling) |
| 4:15–5:00 | AWS Console: IAM Roles (inline policies, least privilege) |

### Purpose
Demonstrate the multi-layered security design: authentication, authorization, encryption, and network protection.

### Narration

> "Security is not a single feature — it's an architecture property. It has to be built into every layer of the system, from the network to the API to the data storage."
>
> "We've implemented six distinct security layers. I'll show you each one in the Terraform code, and then we'll verify the most important ones live in the AWS Console."

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
   > "Let's verify the authentication layer live."
   > *(Click Tab 12)*
   - Click the `urbanmove-user-pool` → click **Sign-in experience** tab:
     - Point to: Sign-in with **email**, MFA = **Optional (TOTP)**
   > "Users sign in with their email. MFA is optional but supported — they can set up a TOTP authenticator app like Google Authenticator for an extra layer of security."
   - Click **Security** tab → point to password policy requirements:
     - Minimum 8 characters, must include uppercase, numbers, and symbols
   > "The password policy enforces strong passwords. Cognito also has built-in brute force protection — it locks accounts after repeated failed attempts."
   - Click **Groups** tab → show the 3 groups in a list:
     - Admin (precedence 1), Operator (precedence 2), Viewer (precedence 3)
   > "We have three role groups. Admin has full access, Operator can manage fleet data, and Viewer can only read dashboards. These map to the RBAC logic in our application."
   - Click **Users** tab → show registered users and their group membership
   - Click **App integration** tab → show the app client and hosted UI domain
   > "Cognito handles all user management — registration, login, password reset, MFA — so our application code doesn't need to."

8. **Navigate to API Gateway** (Tab 11):
   > *(Click Tab 11)*
   - Click `urbanmove-api` → click **Authorization** in the left sidebar:
     - Show the `cognito-authorizer` — point to: type = JWT, identity source = `$request.header.Authorization`
   > "This JWT authorizer checks every request for a valid Cognito token. If the token is missing, expired, or invalid, the request is rejected right here — it never reaches our containers."
   - Click **Routes** in the left sidebar → show the full route table:
     - Scroll through and point out the **public routes** (no lock icon): `/auth/{proxy+}`, `GET /health`, `POST /telemetry`
     - Point out the **protected routes** (lock icon): `GET /vehicles`, `GET /analytics/*`, `PUT /alerts/{id}/acknowledge`, etc.
   > "You can see which routes are public and which require authentication. The telemetry ingestion endpoint is public because it's called by IoT devices that authenticate differently. Everything else requires a JWT."
   - Click **Stages** → click `$default` → show **Throttling**: burst = 1000, rate = 500
   > "Rate limiting is set at 500 requests per second with a burst of 1000. This protects the backend from DDoS attacks and runaway clients."
   - Click **VPC Links** → show the VPC Link connecting to the private subnets

9. **Navigate to IAM Roles** (Tab 21):
   - Search for `urbanmove` → show the 3 roles:
     - `urbanmove-ecs-task-execution` — pulls images, writes logs
     - `urbanmove-ecs-task` — app permissions (DynamoDB, Kinesis)
     - `urbanmove-lambda-role` — Lambda permissions
   - Click `urbanmove-ecs-task` → show the **inline policy** with scoped DynamoDB/Kinesis permissions
   > "Each role follows least privilege — the ECS task role can only access the 4 DynamoDB tables and the Kinesis stream. Nothing else."

### Talking Points

- **Key phrase to say:** *"Every security control you just saw in the console was created by Terraform. If someone manually disables MFA or changes a security group rule, we can detect the drift and restore it with `terraform apply`."*
- Every security control is codified — no manual console configuration that could drift
- Defense in depth: compromise of one layer doesn't expose the entire system
- User enumeration protection prevents attackers from discovering valid email addresses
- Encryption covers data at rest (KMS) and in transit (HTTPS/TLS)

### Transition

> "The final pillar is scalability and cost — how this architecture grows under load and how we keep costs under control."

---

## Scenario 7: Scalability, High Availability & Cost Optimization (~4 minutes)

### Sub-Timing
| Time | Action |
|------|--------|
| 0:00–0:45 | Show auto-scaling config in `ecs.tf`, explain scaling behavior |
| 0:45–1:15 | Show multi-AZ diagram, explain HA |
| 1:15–1:45 | Show cost optimization table (Fargate Spot, DynamoDB on-demand, S3 lifecycle) |
| 1:45–2:15 | Show disaster recovery (PITR, S3 versioning, Terraform rebuild) |
| 2:15–2:45 | AWS Console: ECS Auto Scaling tab + task AZ distribution |
| 2:45–3:15 | AWS Console: CloudFront distribution (PriceClass, OAC) |
| 3:15–4:00 | AWS Console: DynamoDB PITR + S3 versioning |

### Purpose
Show the auto-scaling configuration, multi-AZ deployment, disaster recovery, and cost optimization strategies.

### Narration

> "The final pillar is making sure this architecture can grow under load, survive failures, and remain cost-efficient."
>
> "We've addressed this with four strategies: auto-scaling for compute, multi-AZ deployment for high availability, tiered storage for cost optimization, and point-in-time recovery for disaster recovery."
>
> "Let me show you each one."

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
   > "Let me show the auto-scaling configuration live in the console."
   > *(Click Tab 6, click into `urbanmove-api-service`)*
   - Click **Auto Scaling** tab → show the scaling policy details:
     - Point to: Minimum = 2, Maximum = 10, Target CPU = 70%
     - Point to: Scale-out cooldown = 60s, Scale-in cooldown = 300s
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
   > *(Click Tab 16)*
   - Click `urbanmove-frontend-*` bucket → click **Properties** tab → scroll to **Bucket Versioning** section → show **Enabled**
   - Click **Objects** tab → toggle **Show versions** → display previous versions of deployed files (e.g., multiple versions of `index.html`)
   > "Every time we deploy a new frontend build, S3 keeps the previous version. If we deploy a broken release, we can instantly restore the previous version — or even roll back automatically with a CloudFront invalidation."

### Talking Points

- **Asymmetric cooldowns**: Scale out fast (60s) but scale in slowly (300s) — prevents thrashing
- **Min count = 2**: Ensures at least one task per AZ at all times
- **DynamoDB on-demand**: Perfect for unpredictable traffic — pay only for what you use
- **Everything is rebuildable**: Terraform + container image + DynamoDB PITR = full recovery
- **Key phrase to say:** *"This entire infrastructure can be destroyed with `terraform destroy` and rebuilt with `terraform apply` in under 15 minutes. That's the ultimate disaster recovery."*

---

## Closing (~2 minutes)

### Narration

> "Let me bring up the architecture diagram one more time."
>
> *(Switch back to the architecture diagram)*
>
> "To summarize — this is a cloud-native architecture that addresses all six pillars required by the project specification. Let me map each one."

### Show Summary Slide (leave on screen while narrating)

| Requirement | How We Address It |
|-------------|-------------------|
| **Scalability** | ECS auto-scaling (2–10 tasks), DynamoDB on-demand, Kinesis sharding |
| **High Availability** | Multi-AZ VPC, 2 NAT gateways, ALB health checks, rolling deployments |
| **Security** | Cognito JWT, IAM least privilege, private subnets, KMS encryption, rate limiting |
| **Cost Optimization** | Fargate Spot, S3 lifecycle, DynamoDB PAY_PER_REQUEST, CloudFront PriceClass_100 |
| **Observability** | CloudWatch dashboard, 3 alarms, 5 log groups, Container Insights, access logging |
| **Disaster Recovery** | DynamoDB PITR, S3 versioning, Terraform IaC, RPO ~1s / RTO ~15min |

> *(Read through each row of the table slowly, pointing to the relevant part of the architecture diagram for each one)*
>
> "Scalability — ECS auto-scaling from 2 to 10 tasks, DynamoDB on-demand billing, and Kinesis sharding."
>
> "High Availability — Multi-AZ VPC with redundant NAT gateways, ALB health checks, and rolling deployments."
>
> "Security — Six layers: Cognito authentication, JWT authorization, IAM least privilege, network isolation, KMS encryption, and API rate limiting."
>
> "Cost Optimization — Fargate Spot for 30% of compute, S3 lifecycle policies that move data to Glacier after 90 days, and DynamoDB pay-per-request billing."
>
> "Observability — A CloudWatch dashboard with 5 live widgets, 3 automated alarms, 5 log groups with differentiated retention, and Container Insights."
>
> "Disaster Recovery — DynamoDB point-in-time recovery with RPO of effectively zero, S3 versioning for instant frontend rollback, and the ability to rebuild the entire infrastructure from Terraform in 15 minutes."
>
> "And the most important point: **every single resource** you saw in the AWS Console today was created by Terraform. There was no manual configuration. The entire platform can be torn down with `terraform destroy` and rebuilt identically with `terraform apply` in under 15 minutes. That's the power of cloud-native, Infrastructure-as-Code architecture."

### Final Screen

> *(Switch to terminal)*

Show the terminal running:
```bash
terraform plan | tail -5
# Plan: 35 to add, 0 to change, 0 to destroy.
```

> "Thank you for watching. We're happy to take any questions about the architecture, the implementation, or the cloud services we used."

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
