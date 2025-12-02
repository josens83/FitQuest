bucket         = "fitquest-terraform-state"
key            = "staging/terraform.tfstate"
region         = "ap-northeast-2"
dynamodb_table = "fitquest-terraform-locks"
encrypt        = true
