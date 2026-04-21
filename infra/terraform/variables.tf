terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region"    { default = "us-east-1" }
variable "project_name"  { default = "urbanmove" }
variable "environment"   { default = "prod" }
variable "container_image" { description = "ECR image URI for the backend container" }
