# ─── Cognito User Pool ────────────────────────────────────────────────────────
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-user-pool"

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  # MFA (optional TOTP)
  mfa_configuration = "OPTIONAL"
  software_token_mfa_configuration {
    enabled = true
  }

  # Email as username
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # User schema
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    string_attribute_constraints { min_length = 5; max_length = 256 }
  }

  schema {
    name               = "role"
    attribute_data_type = "String"
    mutable            = true
    string_attribute_constraints { min_length = 1; max_length = 20 }
  }

  # Email verification
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "UrbanMove – Verify your account"
    email_message        = "Your verification code is {####}"
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = { Project = var.project_name }
}

# ─── App Client ───────────────────────────────────────────────────────────────
resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.project_name}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false  # Public client (browser/mobile)

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
  ]

  access_token_validity  = 8    # hours
  id_token_validity      = 8
  refresh_token_validity = 30   # days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  prevent_user_existence_errors = "ENABLED"

  callback_urls = [
    "https://${var.project_name}.example.com",
    "http://localhost:5173",
  ]
  logout_urls = ["http://localhost:5173/login"]

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true
  supported_identity_providers         = ["COGNITO"]
}

# ─── User Groups ──────────────────────────────────────────────────────────────
resource "aws_cognito_user_group" "admin" {
  name         = "Admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Platform administrators"
  precedence   = 1
}

resource "aws_cognito_user_group" "operator" {
  name         = "Operator"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Fleet operators"
  precedence   = 2
}

resource "aws_cognito_user_group" "viewer" {
  name         = "Viewer"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Read-only dashboard viewers"
  precedence   = 3
}

# ─── Domain ───────────────────────────────────────────────────────────────────
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_id"  { value = aws_cognito_user_pool.main.id }
output "cognito_client_id"     { value = aws_cognito_user_pool_client.app.id }
output "cognito_domain"        { value = aws_cognito_user_pool_domain.main.domain }
