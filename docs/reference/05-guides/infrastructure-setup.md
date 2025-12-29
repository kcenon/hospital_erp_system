# Infrastructure Setup Guide

## Document Information

| Item | Content |
|------|------|
| Document Version | 0.1.0.0 |
| Created Date | 2025-12-29 |
| Status | Draft |
| Manager | kcenon@naver.com |

---

## 1. Infrastructure Overview

### 1.1 Environment Classification

| Environment | Purpose | Characteristics |
|------|------|------|
| **Development** | Developer local | Docker Compose |
| **Staging** | Testing/QA | Production-like |
| **Production** | Live operations | High availability, security |

### 1.2 AWS Service Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Service Configuration                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Compute        │  ECS Fargate (serverless containers)          │
│  Database       │  RDS PostgreSQL (managed)                     │
│  Cache          │  ElastiCache Redis                            │
│  Storage        │  S3 (static files, backups)                   │
│  CDN            │  CloudFront                                   │
│  Load Balancer  │  ALB (Application Load Balancer)              │
│  DNS            │  Route 53                                     │
│  Certificates   │  ACM (AWS Certificate Manager)                │
│  Secrets        │  Secrets Manager                              │
│  Monitoring     │  CloudWatch, X-Ray                            │
│  Security       │  WAF, Security Groups, IAM                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. AWS Network Configuration

### 2.1 VPC Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VPC: 10.0.0.0/16                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────── Availability Zone A ──────────────────────┐          │
│  │                                                               │          │
│  │  ┌─────────────────────────────────────────────────────────┐ │          │
│  │  │  Public Subnet: 10.0.1.0/24                              │ │          │
│  │  │  - NAT Gateway                                           │ │          │
│  │  │  - ALB                                                   │ │          │
│  │  └─────────────────────────────────────────────────────────┘ │          │
│  │                                                               │          │
│  │  ┌─────────────────────────────────────────────────────────┐ │          │
│  │  │  Private Subnet (App): 10.0.10.0/24                      │ │          │
│  │  │  - ECS Tasks                                             │ │          │
│  │  └─────────────────────────────────────────────────────────┘ │          │
│  │                                                               │          │
│  │  ┌─────────────────────────────────────────────────────────┐ │          │
│  │  │  Private Subnet (Data): 10.0.20.0/24                     │ │          │
│  │  │  - RDS Primary                                           │ │          │
│  │  │  - ElastiCache                                           │ │          │
│  │  └─────────────────────────────────────────────────────────┘ │          │
│  │                                                               │          │
│  └───────────────────────────────────────────────────────────────┘          │
│                                                                              │
│  ┌─────────────────── Availability Zone B ──────────────────────┐          │
│  │  (Same structure - Multi-AZ high availability)               │          │
│  │  - Public: 10.0.2.0/24                                       │          │
│  │  - Private App: 10.0.11.0/24                                 │          │
│  │  - Private Data: 10.0.21.0/24                                │          │
│  └───────────────────────────────────────────────────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Terraform VPC Module

```hcl
# terraform/modules/vpc/main.tf

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
    Type = "Public"
  }
}

# Private App Subnets
resource "aws_subnet" "private_app" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-app-${count.index + 1}"
    Type = "Private"
  }
}

# Private Data Subnets
resource "aws_subnet" "private_data" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-data-${count.index + 1}"
    Type = "Private"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-${count.index + 1}"
  }
}
```

---

## 3. ECS Fargate Configuration

### 3.1 Cluster and Service

```hcl
# terraform/modules/ecs/main.tf

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.project_name}-cluster"
    Environment = var.environment
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}
```

### 3.2 Task Definition

```hcl
# terraform/modules/ecs/task-definition.tf

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = var.environment },
        { name = "PORT", value = "3000" }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.secrets_arn}:DATABASE_URL::"
        },
        {
          name      = "JWT_ACCESS_SECRET"
          valueFrom = "${var.secrets_arn}:JWT_ACCESS_SECRET::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project_name}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "app"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.project_name}-task"
    Environment = var.environment
  }
}
```

### 3.3 Service and Auto Scaling

```hcl
# terraform/modules/ecs/service.tf

resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = {
    Name        = "${var.project_name}-service"
    Environment = var.environment
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.project_name}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
```

---

## 4. RDS PostgreSQL Configuration

### 4.1 RDS Instance

```hcl
# terraform/modules/rds/main.tf

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = var.private_data_subnet_ids

  tags = {
    Name = "${var.project_name}-db-subnet"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = var.environment == "production"
  publicly_accessible    = false

  backup_retention_period = var.backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-final-snapshot" : null

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  parameter_group_name = aws_db_parameter_group.main.name

  tags = {
    Name        = "${var.project_name}-db"
    Environment = var.environment
  }
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-pg16-params"
  family = "postgres16"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log queries taking 1+ seconds
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = {
    Name = "${var.project_name}-pg-params"
  }
}
```

---

## 5. ElastiCache Redis Configuration

```hcl
# terraform/modules/elasticache/main.tf

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-redis-subnet"
  subnet_ids = var.private_data_subnet_ids
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.project_name}-redis"
  description         = "Redis cluster for ${var.project_name}"

  node_type            = var.node_type
  num_cache_clusters   = var.environment == "production" ? 2 : 1
  port                 = 6379

  engine               = "redis"
  engine_version       = "7.0"
  parameter_group_name = "default.redis7"

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.auth_token

  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled          = var.environment == "production"

  snapshot_retention_limit = var.environment == "production" ? 7 : 0
  snapshot_window         = "02:00-03:00"

  tags = {
    Name        = "${var.project_name}-redis"
    Environment = var.environment
  }
}
```

---

## 6. Application Load Balancer

```hcl
# terraform/modules/alb/main.tf

resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = var.public_subnet_ids

  enable_deletion_protection = var.environment == "production"

  tags = {
    Name        = "${var.project_name}-alb"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_target_group" "app" {
  name        = "${var.project_name}-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher            = "200"
    path               = "/health"
    port               = "traffic-port"
    protocol           = "HTTP"
    timeout            = 5
    unhealthy_threshold = 3
  }

  tags = {
    Name = "${var.project_name}-tg"
  }
}
```

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: ap-northeast-2
  ECR_REPOSITORY: hospital-erp
  ECS_CLUSTER: hospital-erp-cluster
  ECS_SERVICE: hospital-erp-service

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Run linting
        run: pnpm lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service ${{ env.ECS_SERVICE }} \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE }}
```

### 7.2 Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

---

## 8. Monitoring Configuration

### 8.1 CloudWatch Alarms

```hcl
# terraform/modules/monitoring/alarms.tf

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU utilization is high"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is high"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  alarm_actions = [var.sns_topic_arn]
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.project_name}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Too many 5XX errors"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  alarm_actions = [var.sns_topic_arn]
}
```

---

## 9. Cost Estimation

### 9.1 Monthly Cost Estimate (Seoul Region)

| Service | Specification | Monthly Cost (USD) |
|--------|------|---------------|
| ECS Fargate | 2 vCPU, 4GB x 2 tasks | ~$80 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ | ~$120 |
| ElastiCache Redis | cache.t3.micro x 2 | ~$30 |
| ALB | Basic usage | ~$20 |
| CloudFront | 100GB transfer | ~$10 |
| S3 | 50GB storage | ~$2 |
| NAT Gateway | 2 instances | ~$70 |
| CloudWatch | Logs, metrics | ~$20 |
| **Total** | | **~$352/month** |

### 9.2 Cost Optimization Options

- **Staging**: Single AZ, smaller instances
- **Reserved Instances**: 30% savings with 1-year RDS reservation
- **Savings Plans**: 20% savings with 1-year Fargate commitment

---

## 10. Checklist

### Infrastructure Deployment Checklist

- [ ] VPC and subnet configuration complete
- [ ] Security groups configured
- [ ] RDS instance created and connected
- [ ] ElastiCache cluster created
- [ ] ECS cluster and service deployed
- [ ] ALB configured and health check verified
- [ ] SSL certificate applied
- [ ] CloudWatch alarms configured
- [ ] CI/CD pipeline tested
- [ ] Backup policy configured
