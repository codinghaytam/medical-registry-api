resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_db_subnet_group" "postgres" {
  name       = "basma-postgres-subnets"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "basma-postgres-subnets"
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "basma-postgres"
  engine                 = "postgres"
  engine_version         = "17"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp3"
  username               = var.db_username
  password               = "ncegbsrbiuzbckrezfiernrourezo"
  db_name                = "medical_app_db"
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = false
  publicly_accessible    = false
  skip_final_snapshot    = true

  tags = {
    Name = "basma-postgres"
  }
}
