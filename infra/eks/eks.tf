module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.30"  # Use a stable version; update as needed

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  // Enable public access to the cluster endpoint
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  // Allow your IP to access the cluster (restrict in production)
  cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]


  access_entries = {
    account_root = {
      principal_arn = "arn:aws:iam::882816897152:root"
      policy_associations = {
        admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }

  eks_managed_node_groups = {
    default = {
      min_size     = var.min_size
      max_size     = var.max_size
      desired_size = var.desired_capacity

      instance_types = [var.instance_type]
      capacity_type  = "ON_DEMAND"

      iam_role_additional_policies = {
        AmazonEKSWorkerNodePolicy          = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
        AmazonEKS_CNI_Policy               = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
        AmazonEC2ContainerRegistryReadOnly = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
        AmazonSSMManagedInstanceCore       = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
      }

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