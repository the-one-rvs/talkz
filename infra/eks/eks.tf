module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.30"  # Use a stable version; update as needed

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default = {
      min_size     = var.min_size
      max_size     = var.max_size
      desired_size = var.desired_capacity

      instance_types = [var.instance_type]
      capacity_type  = "ON_DEMAND"

      tags = {
        Environment = "dev"
        Owner       = "talkz-project"
      }
    }
  }

  # Ensure IAM roles are created automatically
  create_iam_role = true

  # Enable access entries for automated IAM management (no manual aws-auth)
  enable_irsa = true

  # Security groups for cluster and nodes
  cluster_security_group_additional_rules = {
    egress_all = {
      description = "Allow all egress traffic"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "egress"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Allow worker K8s API server to communicate with each other"
      protocol    = "-1"
      from_port   = 0
      to_port     = 65535
      type        = "ingress"
      self        = true
    }
    ingress_cluster_https = {
      description = "Allow pods to communicate with the cluster API Server"
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      type        = "ingress"
      cidr_blocks = [module.vpc.vpc_cidr_block]
    }
  }

  tags = {
    Environment = "dev"
    Owner       = "talkz-project"
  }
}