data "aws_ami" "debian" {
  most_recent = true
  owners      = ["136693071363"]

  filter {
    name   = "name"
    values = ["debian-12-amd64-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_lb" "app" {
  name               = "basma-app-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = {
    Name = "basma-app-alb"
  }
}

resource "aws_lb_target_group" "node" {
  name_prefix = "node-"
  port        = 3000
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    path                = "/health"
    matcher             = "200-399"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 5
  }
}

resource "aws_lb_target_group" "keycloak" {
  name_prefix = "kc-"
  port        = 8080
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    path                = "/realms/master"
    matcher             = "200-399"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 5
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.node.arn
  }
}

resource "aws_lb_listener_rule" "keycloak" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.keycloak.arn
  }

  condition {
    path_pattern {
      values = ["/keycloak*", "/auth*", "/realms*", "/admin/*"]
    }
  }
}

resource "random_password" "keycloak_admin" {
  length  = 16
  special = false
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.debian.id
  instance_type               = var.app_instance_type
  subnet_id                   = aws_subnet.public_a.id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.app_instances.id]
  iam_instance_profile        = aws_iam_instance_profile.app.name
  key_name                    = var.ec2_key_name == "" ? null : var.ec2_key_name

  user_data = templatefile("${path.module}/node-docker.sh", {
    node_app_image    = var.node_app_image,
    s3_bucket         = aws_s3_bucket.uploads.bucket,
    database_host     = aws_db_instance.postgres.address,
    database_name     = aws_db_instance.postgres.db_name,
    database_user     = var.db_username,
    database_password = random_password.db_password.result
  })

  tags = {
    Name = "medical-node"
  }
}

resource "aws_instance" "keycloak" {
  ami                         = data.aws_ami.debian.id
  instance_type               = var.keycloak_instance_type
  subnet_id                   = aws_subnet.public_b.id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.app_instances.id]
  iam_instance_profile        = aws_iam_instance_profile.app.name
  key_name                    = var.ec2_key_name == "" ? null : var.ec2_key_name

  user_data = file("./keycloak-startup.sh")

  tags = {
    Name = "basma-keycloak"
  }
}

resource "aws_lb_target_group_attachment" "app" {
  target_group_arn = aws_lb_target_group.node.arn
  target_id        = aws_instance.app.id
  port             = 3000
}

resource "aws_lb_target_group_attachment" "keycloak" {
  target_group_arn = aws_lb_target_group.keycloak.arn
  target_id        = aws_instance.keycloak.id
  port             = 8080
}
