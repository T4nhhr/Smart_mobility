# ─── DynamoDB Tables ──────────────────────────────────────────────────────────

resource "aws_dynamodb_table" "vehicles" {
  name         = "Vehicles"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "vehicleId"

  attribute {
    name = "vehicleId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    projection_type = "ALL"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "Vehicles", Project = var.project_name }
}

resource "aws_dynamodb_table" "telemetry" {
  name         = "Telemetry"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "vehicleId"
  range_key    = "timestamp"

  attribute {
    name = "vehicleId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "zone"
    type = "S"
  }

  global_secondary_index {
    name            = "zone-index"
    hash_key        = "zone"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "Telemetry", Project = var.project_name }
}

resource "aws_dynamodb_table" "routes" {
  name         = "Routes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "routeId"

  attribute {
    name = "routeId"
    type = "S"
  }

  attribute {
    name = "vehicleId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "N"
  }

  global_secondary_index {
    name            = "vehicleId-index"
    hash_key        = "vehicleId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "Routes", Project = var.project_name }
}

resource "aws_dynamodb_table" "alerts" {
  name         = "Alerts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "alertId"

  attribute {
    name = "alertId"
    type = "S"
  }

  attribute {
    name = "vehicleId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "N"
  }

  global_secondary_index {
    name            = "vehicleId-createdAt-index"
    hash_key        = "vehicleId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "Alerts", Project = var.project_name }
}
