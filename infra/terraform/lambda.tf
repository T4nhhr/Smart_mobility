# ─── IAM Role for Lambda ──────────────────────────────────────────────────────
resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["kinesis:GetRecords", "kinesis:GetShardIterator", "kinesis:DescribeStream", "kinesis:ListStreams", "kinesis:ListShards"]
        Resource = aws_kinesis_stream.telemetry.arn
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:BatchWriteItem"]
        Resource = [aws_dynamodb_table.telemetry.arn, aws_dynamodb_table.vehicles.arn, aws_dynamodb_table.alerts.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.data_lake.arn}/*"
      }
    ]
  })
}

# ─── Lambda Processor (Kinesis → DynamoDB) ────────────────────────────────────
resource "aws_cloudwatch_log_group" "lambda_processor" {
  name              = "/aws/lambda/${var.project_name}-processor"
  retention_in_days = 14
}

resource "aws_lambda_function" "processor" {
  function_name = "${var.project_name}-telemetry-processor"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 60
  memory_size   = 256
  filename      = data.archive_file.processor.output_path

  environment {
    variables = {
      DYNAMODB_TELEMETRY_TABLE = aws_dynamodb_table.telemetry.name
      DYNAMODB_VEHICLES_TABLE  = aws_dynamodb_table.vehicles.name
      DYNAMODB_ALERTS_TABLE    = aws_dynamodb_table.alerts.name
      S3_DATA_LAKE_BUCKET      = aws_s3_bucket.data_lake.bucket
      AWS_ACCOUNT_REGION       = var.aws_region
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_processor]
  tags = { Project = var.project_name }
}

data "archive_file" "processor" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/processor"
  output_path = "${path.module}/../../lambda/processor.zip"
}

# ─── Kinesis Trigger for Lambda ───────────────────────────────────────────────
resource "aws_lambda_event_source_mapping" "kinesis_trigger" {
  event_source_arn              = aws_kinesis_stream.telemetry.arn
  function_name                 = aws_lambda_function.processor.arn
  starting_position             = "LATEST"
  batch_size                    = 100
  parallelization_factor        = 2
  bisect_batch_on_function_error = true
  maximum_retry_attempts        = 3

  filter_criteria {
    filter {
      pattern = jsonencode({ data = { vehicleId = [{ exists = true }] } })
    }
  }
}

# ─── Lambda Analytics (scheduled aggregator) ──────────────────────────────────
resource "aws_cloudwatch_log_group" "lambda_analytics" {
  name              = "/aws/lambda/${var.project_name}-analytics"
  retention_in_days = 14
}

resource "aws_lambda_function" "analytics" {
  function_name = "${var.project_name}-analytics-aggregator"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 300
  memory_size   = 512
  filename      = data.archive_file.analytics.output_path

  environment {
    variables = {
      DYNAMODB_TELEMETRY_TABLE = aws_dynamodb_table.telemetry.name
      DYNAMODB_VEHICLES_TABLE  = aws_dynamodb_table.vehicles.name
      S3_DATA_LAKE_BUCKET      = aws_s3_bucket.data_lake.bucket
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_analytics]
  tags = { Project = var.project_name }
}

data "archive_file" "analytics" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/analytics"
  output_path = "${path.module}/../../lambda/analytics.zip"
}

# ─── EventBridge Schedule (runs analytics every 5 minutes) ────────────────────
resource "aws_cloudwatch_event_rule" "analytics_schedule" {
  name                = "${var.project_name}-analytics-schedule"
  description         = "Trigger analytics aggregation every 5 minutes"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "analytics_lambda" {
  rule      = aws_cloudwatch_event_rule.analytics_schedule.name
  target_id = "analytics-lambda"
  arn       = aws_lambda_function.analytics.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analytics.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.analytics_schedule.arn
}
