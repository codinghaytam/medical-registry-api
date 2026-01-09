variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-west-3" # Paris (closest affordable region to Morocco)
}

variable "node_app_image" {
  description = "Container image URI for the Node.js API"
  type        = string
}

variable "keycloak_image" {
  description = "Container image URI for the Keycloak server"
  type        = string
  default     = "quay.io/keycloak/keycloak:24.0.5"
}

variable "app_instance_type" {
  description = "Instance size for the Node.js EC2 host"
  type        = string
  default     = "t3.micro"
}

variable "keycloak_instance_type" {
  description = "Instance size for the Keycloak EC2 host"
  type        = string
  default     = "t3.small"
}

variable "db_username" {
  description = "Master username for the RDS PostgreSQL instance"
  type        = string
  default     = "medical_admin"
}

variable "db_instance_class" {
  description = "Instance size for RDS"
  type        = string
  default     = "db.t4g.micro"
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to reach the public load balancer"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ssh_allowed_cidr_blocks" {
  description = "CIDR blocks allowed to SSH into EC2 instances"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ec2_key_name" {
  description = "Name of an existing EC2 key pair to attach to the instances"
  type        = string
  default     = "haytam"
}
