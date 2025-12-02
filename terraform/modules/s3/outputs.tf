output "assets_bucket_name" {
  value = aws_s3_bucket.assets.id
}

output "assets_bucket_arn" {
  value = aws_s3_bucket.assets.arn
}

output "assets_bucket_domain_name" {
  value = aws_s3_bucket.assets.bucket_regional_domain_name
}

output "backups_bucket_name" {
  value = aws_s3_bucket.backups.id
}

output "backups_bucket_arn" {
  value = aws_s3_bucket.backups.arn
}
