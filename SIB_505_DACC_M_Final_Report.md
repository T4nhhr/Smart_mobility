# SIB_505_DACC_M — Cloud Native Smart Mobility Platform Design and Implementation

**EPITA - École d'Ingénieurs en Informatique**  
**Course:** SIB_505_DACC_M Big Data Infrastructure & Cloud Computing  
**Instructor:** Dr. Badre Bousalem

---

## Team Members

1. Jestin Oonnunny Saji
2. Pooja Sri Kuppuswamy Niranjana
3. Prabanjan Velayutham
4. Vignesh Mani

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Implementation Process](#4-implementation-process)
   - 4.1 Launching EC2 Instance
   - 4.2 Connecting via SSH and Installing Software
   - 4.3 Setting Up the FastAPI Application
   - 4.4 RDS PostgreSQL Database
   - 4.5 Connecting EC2 to RDS
   - 4.6 API Gateway
   - 4.7 Rate Limiting
   - 4.8 IAM Roles
   - 4.9 S3 Bucket
   - 4.10 SNS Alerts
   - 4.11 CloudWatch Monitoring
   - 4.12 S3 Bucket Versioning
   - 4.13 RDS Snapshot
   - 4.14 GitHub Backup
   - 4.15 Cognito Authentication
   - 4.16 Cognito JWT Authorizer
   - 4.17 GPS Data Simulator
5. [Security Design](#5-security-design)
6. [Scalability Strategy](#6-scalability-strategy)
7. [Cost Analysis](#7-cost-analysis)
8. [Disaster Recovery Strategy](#8-disaster-recovery-strategy)
9. [Lessons Learned](#9-lessons-learned)
10. [References](#10-references)
11. [Appendix](#11-appendix)

---

## 1. Introduction

Urban cities generate large amounts of transportation data every day. Managing this data in real time requires a system that is fast, secure and always available. Cloud platforms make it possible to build such systems without needing expensive physical hardware.

This report describes the design and implementation of **UrbanMove**, a cloud-based Smart Mobility Management System built for a fictional city authority. The platform collects GPS data from simulated vehicles, stores it in a managed database, exposes it through a secure REST API and monitors system health using cloud observability tools.

The platform was deployed on **Amazon Web Services (AWS)** using the free tier. Every service was configured manually through the AWS console and verified through testing before the next step was started.

### 1.1 Objectives

- Deploy a working cloud application on AWS that collects and stores real-time GPS mobility data.
- Secure the API using Cognito authentication so that only logged-in users can access data.
- Monitor the system using CloudWatch and receive email alerts when the server is under high load.
- Back up the database and source code so the system can be restored quickly if something goes wrong.
- Demonstrate all cloud architecture principles required by the project specification.

---

## 2. System Architecture

The system is designed as a simple cloud-native architecture using AWS services. It allows users to send data through an API which is processed by a backend running on EC2. The system stores data in a database and uses monitoring tools to track performance.

The architecture has five main layers:

- **Edge Layer** — Handles all incoming HTTPS traffic through API Gateway, which checks each user's login token using AWS Cognito before passing the request to the application.
- **Compute Layer** — A single EC2 t2.micro instance that runs the FastAPI application.
- **Data Layer** — Stores GPS mobility events in an RDS PostgreSQL database and files in an S3 bucket.
- **Observability Layer** — Uses CloudWatch to collect metrics and send email alerts through SNS.
- **Disaster Recovery Layer** — Uses RDS automatic snapshots, S3 versioning and a GitHub repository that can be used to redeploy the system if needed.

### Table 1 — Summary of Implemented AWS Services

| AWS Service | Purpose | Free Tier |
|---|---|---|
| EC2 t2.micro | Runs FastAPI application and GPS simulator | 750 hrs/month |
| RDS PostgreSQL db.t3.micro | Stores mobility_data table with GPS records | 750 hrs/month |
| S3 Bucket | Stores uploaded files, logs, and backups | 5 GB |
| API Gateway (HTTP API) | Exposes HTTPS endpoints with rate limiting | 1M calls/month |
| AWS Cognito | User pool for login and JWT token issuance | 50,000 MAU |
| IAM Role | Grants EC2 access to S3 without hardcoded keys | Free |
| Security Groups | Firewall controlling inbound and outbound traffic | Free |
| CloudWatch | Collects CPU metrics, stores logs, triggers alarms | Basic free |
| SNS | Sends email when CloudWatch alarm fires | 1M notifications free |
| GitHub | Source code storage and infrastructure backup | Free |

---

## 3. Technology Stack

The platform uses a small set of tools that work well together. The backend is written in Python using FastAPI, which is a lightweight and fast web framework for building REST APIs. The database is PostgreSQL managed by AWS RDS. The application runs inside a Python virtual environment on the EC2 instance. A separate simulator script generates fake GPS data and sends it to the API automatically to simulate real vehicle data.

### Table 2 — Application Technology Stack

| Component | Technology | Reason |
|---|---|---|
| Backend API | FastAPI (Python) | Simple, fast REST framework with built-in data validation |
| Database driver | psycopg2 | Standard PostgreSQL connector for Python |
| Web server | Uvicorn | ASGI server used to run FastAPI on port 8000 |
| Database | PostgreSQL via AWS RDS | Managed relational database with automatic backups and encryption |
| Object storage | AWS S3 | Stores logs and backup files with versioning enabled |
| Authentication | AWS Cognito with JWT | Handles user login and issues secure tokens for API access |
| API management | AWS API Gateway | Provides HTTPS endpoint, rate limiting, and JWT authorizer |
| Monitoring | AWS CloudWatch & SNS | Tracks CPU usage and sends email alerts automatically |
| Source control | GitHub | Version control and full infrastructure backup |
| Simulator | Python requests library | Sends random GPS coordinates to the API every few seconds |

---

## 4. Implementation Process

The platform was built step by step. Each component was configured and tested before moving on to the next.

### 4.1 Launching EC2 Instance

The first step was to create a virtual machine on AWS. An EC2 t2.micro instance was launched using the Ubuntu AMI. This instance type is part of the AWS free tier which means it costs nothing for the first 750 hours each month. The instance was given the name **mobility-server**.

During setup, a security group was configured with inbound rules to allow:
- SSH access on **port 22**
- HTTP access on **port 80**
- Application access on **port 8000**

A key pair was created and downloaded to allow secure SSH login from a local machine.

### 4.2 Connecting via SSH and Installing Software

After the instance started, the private key file permissions were changed using the `chmod` command to make the SSH connection secure. SSH was then used to log in to the instance from a local terminal. Once connected, the system packages were updated using the `apt update` command to make sure all software was current before adding new packages.

### 4.3 Setting Up the FastAPI Application

Python and the virtual environment package were installed on the EC2 instance. A virtual environment was created to keep the project dependencies separate from the system Python installation. FastAPI and Uvicorn were installed inside this environment.

A basic FastAPI application was written with two endpoints:
- A **root endpoint** (`/`) that returns a welcome message
- A **health endpoint** (`/health`) that confirms the application is running

The application was started using Uvicorn on port 8000. The public IP address of the EC2 instance was used to access both endpoints from a web browser to confirm they were responding correctly.

### 4.4 RDS PostgreSQL Database

An Amazon RDS instance was created using the PostgreSQL engine. The `db.t3.micro` instance type was selected because it is included in the AWS free tier. The database was given a username and password during setup. Monitoring, performance insights, and encryption at rest were all enabled during configuration to meet security requirements.

### 4.5 Connecting EC2 to RDS

The PostgreSQL client was installed on the EC2 instance. A connection to the RDS database was made using the endpoint address and credentials from the RDS configuration. Once connected, a table called `mobility_data` was created to store GPS records with fields for vehicle ID, latitude, longitude, speed and timestamp. Sample records were inserted to confirm the table was working.

The FastAPI application was then updated to use `psycopg2` to connect to the database. Two new endpoints were added:
- One to **insert** GPS data
- One to **retrieve** all stored records

The application was restarted and both endpoints were tested to confirm they were reading from and writing to the database correctly.

### 4.6 API Gateway

An HTTP API was created in AWS API Gateway. This gives the application a public HTTPS endpoint and acts as the entry point for all incoming requests. The API Gateway was configured to forward all requests to the EC2 instance. Routes were defined using a proxy resource so that any path is forwarded to the application automatically.

### 4.7 Rate Limiting

Rate limiting was configured on the API Gateway to protect the application from too many requests at once. The throttling settings limit the number of requests allowed per second. This helps prevent abuse of the API and keeps the EC2 instance stable during high load periods.

Default route throttling was configured with:
- **Burst limit:** 10
- **Rate limit:** 5

### 4.8 IAM Roles

An IAM role was created to give the EC2 instance permission to access the S3 bucket. Without this role, the application would need to store AWS credentials directly on the server, which is a security risk. The role was created with EC2 as the trusted entity and the `AmazonS3FullAccess` policy was attached to it.

After the role was created, it was attached to the running EC2 instance. The AWS CLI was installed on the instance and a test file was uploaded to S3 to confirm the role was working correctly.

### 4.9 S3 Bucket

An S3 bucket was created to store files from the application. Amazon S3 is object storage that allows files to be uploaded and accessed from anywhere. The bucket was configured during creation with default settings and a test file was uploaded from the EC2 instance to confirm the IAM role connection was working.

### 4.10 SNS Alerts

Amazon SNS was used to set up email notifications for system alerts. An SNS topic was created and an email address was subscribed to it. When a CloudWatch alarm is triggered, SNS sends an email to that address automatically. A confirmation email was received to verify the subscription was active before creating the alarm.

### 4.11 CloudWatch Monitoring

CloudWatch was set up to monitor the EC2 instance. A new alarm was created using the `CPUUtilization` metric for the mobility server instance. The alarm is triggered when CPU usage goes above **70 percent** for two consecutive minutes. When this happens, it sends a notification through the SNS topic to the subscribed email address.

A CloudWatch log group was also created to collect application logs from the EC2 instance. Log events were sent from the instance to CloudWatch using the AWS CLI and were then visible inside the log stream in the CloudWatch console.

### 4.12 S3 Bucket Versioning

Versioning was enabled on the S3 bucket. When versioning is on, AWS keeps a copy of every previous version of every file stored in the bucket. This means that if a file is accidentally deleted or overwritten, an older version can be recovered. Versioning was confirmed as enabled and tested by uploading multiple versions of the same file.

### 4.13 RDS Snapshot

A manual snapshot of the RDS database was taken and named **mobility-snapshot-1**. A snapshot is a complete backup of the database at a specific point in time. AWS also takes automatic daily snapshots and keeps them for seven days by default. This means the database can be restored to any point within the last week if data is lost or corrupted.

### 4.14 GitHub Backup

Git was installed on the EC2 instance and a local Git repository was created inside the project folder. The application code was committed and pushed to a remote GitHub repository called `Pooja-01161/mobility-project`. This means the full source code is stored safely on GitHub and can be used to redeploy the application at any time by cloning the repository onto a new EC2 instance.

### 4.15 Cognito Authentication

AWS Cognito was used to add user authentication to the platform. A user pool was created and an application called **mobility-app** was configured with email sign-in and a redirect URL. A test user was created with the email address `hintypinty@gmail.com` and a temporary password to verify the sign-up and login flow.

### 4.16 Cognito JWT Authorizer

A JWT authorizer called **cognito-auth** was created in API Gateway and linked to the Cognito user pool. The authorizer checks the Bearer token included in every API request before the request is passed to the EC2 application. If the token is missing or invalid, the request is rejected at the gateway. This protects all API routes from unauthenticated access without the application needing to handle the token verification itself.

A hosted login page was configured using the Cognito domain. The test user logged in through this page and was redirected to the callback URL with an authorisation code in the URL. This code was exchanged for a JWT access token using a `curl` command. The token was then used in the `Authorization` header of a `GET /data` request, which successfully returned GPS records from the database.

**Cognito hosted login URL:**
```
https://us-east-1tiozr1nru.auth.us-east-1.amazoncognito.com/login?client_id=h83ed9k292js3q836c943qjcs&response_type=code&scope=openid+email&redirect_uri=https://example.com
```

### 4.17 GPS Data Simulator

Two Python scripts make up the working application.

**`app.py`** defines the FastAPI application with two main endpoints:
- `/add` — accepts GPS data as a JSON body and writes it to the `mobility_data` table in PostgreSQL
- `/data` — reads all records from the table and returns them as a JSON list

```python
from fastapi import FastAPI
from pydantic import BaseModel
import psycopg2

app = FastAPI()

conn = psycopg2.connect(
    host="mobility-db.c4fyoomgcks0.us-east-1.rds.amazonaws.com",
    database="postgres",
    user="postgres",
    password="postgres123"
)

class GPSData(BaseModel):
    latitude: float
    longitude: float

@app.post("/add")
def add_data(data: GPSData):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO mobility_data (location, speed) VALUES (%s, %s)",
        (f"{data.latitude},{data.longitude}", 50)
    )
    conn.commit()
    return {"message": "GPS data stored"}

@app.get("/data")
def get_data():
    cur = conn.cursor()
    cur.execute("SELECT * FROM mobility_data")
    rows = cur.fetchall()
    return {"data": rows}
```

**`simulator.py`** automatically generates random GPS coordinates and sends them to the `/add` endpoint every few seconds. It includes a Bearer token in each request so that the Cognito authorizer allows the request through. This simulates a real vehicle continuously sending its location to the platform.

After running the simulator, the database was queried directly using the psql client. The query returned **22 rows** in the `mobility_data` table, confirming that the full end-to-end flow from simulator through the API to the database was working correctly.

---

## 5. Security Design

Security was applied at every layer of the architecture to protect the platform and its data from common threats.

### 5.1 Identity and Access Management

AWS Cognito handles all user authentication. Users must log in with their email and password to receive a JWT access token. This token must be included in every API request. The API Gateway checks the token before any request reaches the EC2 application. Requests without a valid token are rejected automatically at the gateway and never reach the server.

The EC2 instance uses an IAM role instead of hardcoded credentials. This role gives the instance permission to access S3 and write to CloudWatch without storing any AWS access keys on the machine.

### 5.2 Network Security

Security groups act as a firewall for both the EC2 instance and the RDS database:
- **Port 22** — open for SSH
- **Port 80 and 8000** — open for HTTP application traffic
- **Port 5432** — PostgreSQL, only accessible from within the same security group

This means the database cannot be reached directly from the internet.

### 5.3 Threat Mitigation

### Table 3 — Security Threat Mitigation Summary

| Threat | Mitigation |
|---|---|
| Unauthorised API access | Cognito JWT authorizer rejects all requests without a valid Bearer token at the gateway level |
| SQL injection | psycopg2 uses parameterised queries by default which prevent injection attacks completely |
| Brute force login | Cognito has built-in account lockout after repeated failed login attempts |
| Credential exposure | IAM instance profile used instead of storing AWS access keys on the EC2 server |
| Unwanted port access | Security groups block all ports except those that are explicitly required |
| Data in transit | HTTPS is enforced at API Gateway for all client-facing communication |
| Data at rest | RDS encryption at rest was enabled during database creation |

---

## 6. Scalability Strategy

The current deployment uses a single EC2 t2.micro instance, which is enough for the prototype and demonstration. The application is written in a stateless way, which makes it easy to scale horizontally later without changing the application code.

### 6.1 Current Capacity

The FastAPI application handles requests on the single EC2 instance using Uvicorn. The RDS db.t3.micro database can handle hundreds of simultaneous connections. For the simulated workload of one GPS record every few seconds, this setup is more than enough.

### 6.2 Future Scaling Options

- Add an **Auto Scaling Group** behind an Application Load Balancer so that additional EC2 instances are launched automatically when traffic increases.
- Add an **RDS read replica** to separate read requests from write requests and reduce load on the primary database instance.
- Move GPS data ingestion to **AWS Lambda and Amazon Kinesis** for serverless, high-throughput event processing.
- Add **Amazon ElastiCache** in front of the database to cache repeated read queries and reduce database response time.

### 6.3 Future Enterprise Architecture

The enterprise-grade architecture is structured within a Virtual Private Cloud (VPC) and distributed across multiple Availability Zones to ensure high availability and fault tolerance. Public subnets handle external access components such as load balancers and NAT gateways while all core application services are securely deployed in private subnets. Incoming requests pass through CloudFront, WAF and API Gateway before reaching the backend services, ensuring secure and controlled access.

The architecture introduces containerised microservices, real-time data streaming and advanced data storage solutions to improve scalability and performance. Services such as Amazon EKS, Kinesis and Aurora enable the system to handle high volumes of mobility data efficiently. Security is enhanced through IAM policies, encryption and network isolation while observability is achieved using CloudWatch and X-Ray.

Key components of the future architecture include:

- **Edge & Access Layer** — CloudFront CDN, AWS WAF, AWS Shield, Amazon API Gateway, Amazon Cognito
- **Application Layer** — Amazon EKS (Kubernetes) / Amazon ECS Fargate with containerised microservices
- **Event & Streaming Layer** — Amazon Kinesis Data Streams, AWS Lambda, Amazon SQS, Amazon SNS
- **Data Layer** — Amazon Aurora PostgreSQL (Multi-AZ), Amazon DynamoDB, Amazon S3, Amazon Redshift, AWS Glue, Amazon Athena
- **Security Layer** — AWS IAM, AWS KMS, AWS Secrets Manager, AWS WAF, Amazon GuardDuty, AWS Security Hub
- **Observability Layer** — Amazon CloudWatch, AWS X-Ray, Amazon SNS alerts
- **DevOps & CI/CD Pipeline** — GitHub, AWS CodePipeline, AWS CodeBuild, Amazon ECR, Amazon EKS/ECS
- **Disaster Recovery** — Multi-Region with RDS Cross-Region Read Replica, S3 Cross-Region Replication, DynamoDB Global Tables

---

## 7. Cost Analysis

The platform was designed to run entirely within the AWS free tier for prototype and assessment purposes. Every service used falls within the free tier limits shown below.

### Table 4 — Estimated Monthly Cost Breakdown

| Service | Free Tier Allowance | Est. Monthly Cost |
|---|---|---|
| EC2 t2.micro | 750 hours/month | $0.00 |
| RDS db.t3.micro | 750 hours/month | $0.00 |
| S3 storage | 5 GB | $0.00 |
| CloudWatch metrics | Basic metrics | $0.00 |
| CloudWatch logs | 5 GB ingestion per month | $0.00 |
| AWS Cognito | 50,000 MAU | $0.00 |
| API Gateway HTTP API | 1 million calls per month | $0.00 |
| SNS notifications | 1 million notifications per month | $0.00 |
| Data transfer out | 15 GB per month | $0.00 |
| IAM and Security Groups | Always free | $0.00 |
| **Total** | **All within free tier** | **$0.00** |

In a real production deployment handling thousands of vehicles, the main cost drivers would be the EC2 instance size, RDS storage, and outbound data transfer. A city-scale deployment is estimated to cost between **$150 and $300 per month** using reserved instances.

---

## 8. Disaster Recovery Strategy

The platform has three layers of backup to make sure both the data and the application can be recovered quickly if something goes wrong.

### 8.1 RDS Automatic Snapshots

Amazon RDS creates an automatic daily snapshot of the database and keeps these for seven days. If the database is accidentally deleted or the data becomes corrupted, it can be restored to any point in the last seven days. A manual snapshot called **mobility-snapshot-1** was also taken as a fixed backup checkpoint during the implementation.

### 8.2 S3 Bucket Versioning

Versioning is enabled on the S3 bucket. Every time a file is changed or deleted, AWS keeps the previous version. This means any file stored in S3 can be recovered from an older version at any point. This protects against accidental file deletion and unintended overwrites.

### 8.3 GitHub Repository

The complete application code, including `app.py`, `simulator.py`, and configuration instructions, is stored on GitHub. If the EC2 instance is terminated or becomes unrecoverable, the entire application can be rebuilt by launching a new EC2 instance and cloning the repository. The estimated time to fully restore the system is **30 to 60 minutes**.

### Table 5 — Recovery Objectives Summary

| Objective | Target | How It Is Achieved |
|---|---|---|
| Recovery Point Objective (RPO) | 24 hours | RDS creates an automatic daily snapshot of the database |
| Recovery Time Objective (RTO) | 30 to 60 minutes | Redeploy from GitHub on a new EC2 instance and restore the latest RDS snapshot |
| File recovery | Any previous version | S3 bucket versioning keeps all previous versions of every file |
| Database point-in-time restore | Any point in 7 days | RDS supports restore to any snapshot within the 7-day retention window |

---

## 9. Lessons Learned

Building and deploying the UrbanMove platform gave the team practical experience with cloud infrastructure and taught several important lessons.

### 9.1 Security Groups Are Critical

Correctly setting up security groups was one of the most important and time-consuming steps. Both the EC2 instance and the RDS database have separate security groups, and the rules must be configured correctly for them to communicate. Incorrect port rules caused connection failures that took time to identify and fix.

### 9.2 Cognito JWT Integration Requires Care

Setting up the JWT authorizer in API Gateway required careful attention to the Cognito issuer URL format and the correct client ID. The hosted login page also needed specific query parameters in the URL to work. Once the configuration was correct, the authentication flow worked reliably every time.

### 9.3 IAM Roles Are Better Than Stored Credentials

Using an IAM instance profile instead of hardcoded AWS credentials is the correct and safer approach. It takes a little longer to configure, but it removes the risk of credentials being exposed if someone gains access to the server.

### 9.4 CloudWatch and SNS Are Easy to Set Up

CloudWatch alarms and log groups were the simplest components to configure. Setting up a CPU alarm took only a few minutes and provided immediate value. Email alerts through SNS worked correctly without any issues.

### 9.5 Design and Implementation Differ in Practice

The original architecture design included an Application Load Balancer and explicit public and private subnet separation. These were not implemented because they add cost beyond the free tier and are not necessary for a single-instance prototype. Security groups provided equivalent network isolation. In a real production system, both would be added before scaling the application to handle real traffic.

---

## 10. References

[1] Amazon Web Services, "Amazon EC2 documentation," AWS, 2024. [Online]. Available: https://docs.aws.amazon.com/ec2/

[2] Amazon Web Services, "Amazon RDS for PostgreSQL user guide," AWS, 2024. [Online]. Available: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html

[3] Amazon Web Services, "Amazon Cognito developer guide," AWS, 2024. [Online]. Available: https://docs.aws.amazon.com/cognito/latest/developerguide/

[4] Amazon Web Services, "Amazon API Gateway developer guide," AWS, 2024. [Online]. Available: https://docs.aws.amazon.com/apigateway/latest/developerguide/

[5] Amazon Web Services, "AWS Identity and Access Management user guide," AWS, 2024. [Online]. Available: https://docs.aws.amazon.com/IAM/latest/UserGuide/

[6] Amazon Web Services, "Amazon CloudWatch user guide," AWS, 2024. [Online]. Available: https://docs.aws.amazon.com/cloudwatch/

[7] Amazon Web Services, "Amazon S3 user guide," AWS, 2024. [Online]. Available: https://docs.aws.amazon.com/AmazonS3/latest/userguide/

[8] Amazon Web Services, "Amazon SNS developer guide," AWS, 2024. [Online]. Available: https://docs.aws.amazon.com/sns/latest/dg/

[9] S. Ramirez, "FastAPI documentation," FastAPI, 2024. [Online]. Available: https://fastapi.tiangolo.com/

[10] The PostgreSQL Global Development Group, "PostgreSQL 16 documentation," PostgreSQL, 2024. [Online]. Available: https://www.postgresql.org/docs/

---

## 11. Appendix

### Appendix A — Source Code Repository

The full source code for the UrbanMove platform is available at: https://github.com/Pooja-01161/mobility-project

The repository contains all files required to redeploy the application on a new EC2 instance.

**`app.py`** is the main FastAPI application file. It connects to the RDS PostgreSQL database using psycopg2 and defines two API endpoints. The `/add` endpoint accepts a JSON body containing GPS coordinates and writes the record to the `mobility_data` table. The `/data` endpoint reads all stored records from the table and returns them as a JSON response. The application runs on port 8000 using Uvicorn.

**`simulator.py`** is the data generation script. It runs in a loop and sends randomly generated GPS coordinates to the `/add` endpoint every few seconds. Each request includes a Cognito Bearer token in the `Authorization` header so that the API Gateway JWT authorizer allows the request through. This script simulates a real vehicle continuously reporting its location to the platform.

### Appendix B — API Endpoint Reference

| Endpoint | Method | Description | Authentication |
|---|---|---|---|
| `/` | GET | Returns a welcome message confirming application is running | Not required |
| `/health` | GET | Returns the health status of the application | Not required |
| `/add` | POST | Accepts a JSON body with GPS data and inserts it into the `mobility_data` table in RDS | Required — Cognito JWT Bearer token |
| `/data` | GET | Retrieves all records stored in the `mobility_data` table and returns them as a JSON list | Required — Cognito JWT Bearer token |

### Appendix C — Cognito Hosted Login URL

The hosted login page for the UrbanMove platform was configured using the AWS Cognito domain. Users can log in through the following URL to receive an authorisation code, which is then exchanged for a JWT access token using a token endpoint request.

```
https://us-east-1tiozr1nru.auth.us-east-1.amazoncognito.com/login?client_id=h83ed9k292js3q836c943qjcs&response_type=code&scope=openid+email&redirect_uri=https://example.com
```

The JWT access token returned after login must be included as a Bearer token in the `Authorization` header of all requests to the `/add` and `/data` endpoints.

### Appendix D — Database Schema

The `mobility_data` table was created in the RDS PostgreSQL database to store GPS records from the simulator.

| Column | Data Type | Description |
|---|---|---|
| id | SERIAL PRIMARY KEY | Auto-incrementing unique identifier for each record |
| vehicle_id | VARCHAR | Identifier of the vehicle sending the data |
| latitude | FLOAT | GPS latitude coordinate |
| longitude | FLOAT | GPS longitude coordinate |
| speed | FLOAT | Speed of the vehicle in km/h |
| timestamp | TIMESTAMP | Date and time when the record was inserted |
