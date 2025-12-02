bucket         = "fitquest-terraform-state"
key            = "production/terraform.tfstate"
region         = "ap-northeast-2"
dynamodb_table = "fitquest-terraform-locks"
encrypt        = true
