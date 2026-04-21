# ─── Kinesis Data Stream ──────────────────────────────────────────────────────
resource "aws_kinesis_stream" "telemetry" {
  name             = "${var.project_name}-telemetry-stream"
  shard_count      = 2
  retention_period = 24  # hours

  stream_mode_details {
    stream_mode = "PROVISIONED"  # Switch to ON_DEMAND for auto-scaling
  }

  encryption_type = "KMS"
  kms_key_id      = "alias/aws/kinesis"

  tags = { Name = "telemetry-stream", Project = var.project_name }
}

output "kinesis_stream_name" { value = aws_kinesis_stream.telemetry.name }
output "kinesis_stream_arn"  { value = aws_kinesis_stream.telemetry.arn }
