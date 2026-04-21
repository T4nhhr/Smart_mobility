# ─── HTTP API Gateway v2 ──────────────────────────────────────────────────────
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
  description   = "UrbanMove Fleet Platform API"

  cors_configuration {
    allow_origins = ["https://${aws_cloudfront_distribution.frontend.domain_name}", "http://localhost:5173"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
    max_age       = 300
  }

  tags = { Project = var.project_name }
}

# ─── VPC Link (connects API GW to ALB in private network) ────────────────────
resource "aws_apigatewayv2_vpc_link" "main" {
  name               = "${var.project_name}-vpclink"
  security_group_ids = [aws_security_group.ecs.id]
  subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  tags               = { Name = "${var.project_name}-vpclink" }
}

# ─── Integration (API GW → ALB via VPC Link) ─────────────────────────────────
resource "aws_apigatewayv2_integration" "alb" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = aws_lb_listener.https.arn

  connection_type = "VPC_LINK"
  connection_id   = aws_apigatewayv2_vpc_link.main.id

  payload_format_version = "1.0"
}

# ─── Cognito Authorizer ───────────────────────────────────────────────────────
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  name             = "cognito-authorizer"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.app.id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
  }
}

# ─── Routes ───────────────────────────────────────────────────────────────────

# Public routes (no auth)
resource "aws_apigatewayv2_route" "auth" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /auth/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

resource "aws_apigatewayv2_route" "telemetry_ingest" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /telemetry"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

resource "aws_apigatewayv2_route" "alerts_create" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /alerts"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

# Protected routes (require Cognito JWT)
locals {
  protected_routes = [
    "GET /vehicles",
    "GET /vehicles/{id}",
    "POST /vehicles",
    "PUT /vehicles/{id}",
    "DELETE /vehicles/{id}",
    "GET /telemetry/{vehicleId}",
    "GET /routes",
    "GET /routes/recommend",
    "POST /routes/calculate",
    "GET /alerts",
    "PUT /alerts/{id}/acknowledge",
    "PUT /alerts/{id}/resolve",
    "GET /analytics/summary",
    "GET /analytics/congestion",
    "GET /analytics/utilization",
    "GET /analytics/speed-trends",
  ]
}

resource "aws_apigatewayv2_route" "protected" {
  for_each = toset(local.protected_routes)

  api_id             = aws_apigatewayv2_api.main.id
  route_key          = each.value
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
  target             = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

# ─── Stage ────────────────────────────────────────────────────────────────────
resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 1000
    throttling_rate_limit  = 500
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
  }

  tags = { Environment = var.environment }
}

# ─── CloudWatch Log Group for API GW ─────────────────────────────────────────
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}"
  retention_in_days = 30
}

output "api_gateway_url" { value = aws_apigatewayv2_stage.prod.invoke_url }
