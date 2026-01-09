resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "uploads" {
  bucket        = "basma-uploads-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name = "basma-uploads"
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.uploads.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowPublicRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject"]
        Resource  = "${aws_s3_bucket.uploads.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role" "app_instances" {
  name               = "basma-ec2-app-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_instance_assume.json
}

resource "aws_iam_role_policy" "app_instances_s3" {
  name = "basma-ec2-s3"
  role = aws_iam_role.app_instances.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = [
          aws_s3_bucket.uploads.arn,
          "${aws_s3_bucket.uploads.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app" {
  name = "basma-app-instance-profile"
  role = aws_iam_role.app_instances.name
}

data "aws_iam_policy_document" "ec2_instance_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}
