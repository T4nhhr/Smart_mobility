# ─── CloudWatch Dashboard ─────────────────────────────────────────────────────
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x = 0
        y = 0
        width = 12
        height = 6
        properties = {
          title  = "API Request Count"
          view   = "timeSeries"
          metrics = [["AWS/ApiGateway", "Count", "ApiId", aws_apigatewayv2_api.main.id]]
          period = 60
          stat   = "Sum"
          region = var.aws_region
        }
      },
      {
        type   = "metric"
        x = 12
        y = 0
        width = 12
        height = 6
        properties = {
          title  = "API Latency P99"
          view   = "timeSeries"
          metrics = [["AWS/ApiGateway", "IntegrationLatency", "ApiId", aws_apigatewayv2_api.main.id]]
          period = 60
          stat   = "p99"
          region = var.aws_region
        }
      },
      {
        type   = "metric"
        x = 0
        y = 6
        width = 8
        height = 6
        properties = {
          title  = "ECS CPU Utilization"
          view   = "timeSeries"
          metrics = [["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.api.name]]
          period = 60
          stat   = "Average"
          region = var.aws_region
        }
      },
      {
        type   = "metric"
        x = 8
        y = 6
        width = 8
        height = 6
        properties = {
          title  = "Kinesis Incoming Records"
          view   = "timeSeries"
          metrics = [["AWS/Kinesis", "IncomingRecords", "StreamName", aws_kinesis_stream.telemetry.name]]
          period = 60
          stat   = "Sum"
          region = var.aws_region
        }
      },
      {
        type   = "metric"
        x = 16
        y = 6
        width = 8
        height = 6
        properties = {
          title  = "DynamoDB Consumed Write Capacity"
          view   = "timeSeries"
          metrics = [
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.telemetry.name],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.vehicles.name],
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
        }
      }
    ]
  })
}

# ─── CloudWatch Alarms ────────────────────────────────────────────────────────

# API 5xx error rate alarm
resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.project_name}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API Gateway 5XX error rate exceeds threshold"

  dimensions = { ApiId = aws_apigatewayv2_api.main.id }

  alarm_actions = []  # Add SNS ARN for notifications
}

# ECS CPU high utilization
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS CPU utilization is above 85%"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }
}

# Lambda processor errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-processor-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda processor has too many errors"

  dimensions = { FunctionName = aws_lambda_function.processor.function_name }
}

# Lambda Log Groups
resource "aws_cloudwatch_log_group" "cloudfront" {
  name              = "/aws/cloudfront/${var.project_name}"
  retention_in_days = 30
}
