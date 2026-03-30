terraform {
  required_version = ">= 1.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
    remote = {
      source  = "tenstad/remote"
      version = "~> 0.1"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "13957464-tf-state"
    key    = "infra/terraform.tfstate"
    region = "hel1"

    endpoints = {
      s3 = "https://hel1.your-objectstorage.com"
    }

    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

provider "aws" {
  region = "hel1"

  endpoints {
    s3 = "https://hel1.your-objectstorage.com"
  }

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
  skip_requesting_account_id  = true
}

# --- SSH Key ---

data "hcloud_ssh_key" "default" {
  name = "daniel-passy-key"
}

data "hcloud_ssh_key" "ci" {
  name = "monorepo-ci"
}

# --- Network ---

resource "hcloud_network" "cluster" {
  name     = "monorepo-cluster"
  ip_range = "10.0.0.0/16"
}

resource "hcloud_network_subnet" "nodes" {
  network_id   = hcloud_network.cluster.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.1.0/24"
}

# --- Firewall ---

resource "hcloud_firewall" "cluster" {
  name = "monorepo-cluster"

  # SSH - restricted to your IP
  dynamic "rule" {
    for_each = var.ssh_allowed_ips
    content {
      direction  = "in"
      protocol   = "tcp"
      port       = "22"
      source_ips = [rule.value]
    }
  }

  # HTTP
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # k3s API - open (TLS + client cert auth)
  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "6443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

# --- Server Node (k3s server) ---

resource "hcloud_server" "server" {
  name        = "monorepo-server"
  server_type = "cx23"
  image       = "ubuntu-24.04"
  location    = "nbg1"
  ssh_keys    = [data.hcloud_ssh_key.default.id, data.hcloud_ssh_key.ci.id]
  firewall_ids = [hcloud_firewall.cluster.id]

  user_data = templatefile("${path.module}/cloud-init/server.yaml", {
    server_private_ip = "10.0.1.1"
  })

  network {
    network_id = hcloud_network.cluster.id
    ip         = "10.0.1.1"
  }

  depends_on = [hcloud_network_subnet.nodes]
}

# Wait for k3s to be ready and fetch the join token
resource "null_resource" "wait_for_k3s" {
  depends_on = [hcloud_server.server]

  connection {
    type        = "ssh"
    host        = hcloud_server.server.ipv4_address
    user        = "root"
    private_key = file(var.ssh_private_key_path)
  }

  provisioner "remote-exec" {
    inline = [
      "echo 'Waiting for k3s to be ready...'",
      "until [ -f /var/lib/rancher/k3s/server/node-token ]; do sleep 2; done",
      "until kubectl get nodes 2>/dev/null | grep -q ' Ready'; do sleep 2; done",
      "echo 'k3s is ready'",
    ]
  }
}

# Read the join token
data "remote_file" "k3s_token" {
  depends_on = [null_resource.wait_for_k3s]

  conn {
    host        = hcloud_server.server.ipv4_address
    user        = "root"
    private_key = file(var.ssh_private_key_path)
  }

  path = "/var/lib/rancher/k3s/server/node-token"
}

# Read the kubeconfig
data "remote_file" "kubeconfig" {
  depends_on = [null_resource.wait_for_k3s]

  conn {
    host        = hcloud_server.server.ipv4_address
    user        = "root"
    private_key = file(var.ssh_private_key_path)
  }

  path = "/etc/rancher/k3s/k3s.yaml"
}

# --- Agent Node (k3s agent) ---

resource "hcloud_server" "agent" {
  name        = "monorepo-agent"
  server_type = "cx23"
  image       = "ubuntu-24.04"
  location    = "nbg1"
  ssh_keys    = [data.hcloud_ssh_key.default.id, data.hcloud_ssh_key.ci.id]
  firewall_ids = [hcloud_firewall.cluster.id]

  user_data = templatefile("${path.module}/cloud-init/agent.yaml", {
    server_private_ip = "10.0.1.1"
    agent_private_ip  = "10.0.1.2"
    k3s_token         = trimspace(data.remote_file.k3s_token.content)
  })

  network {
    network_id = hcloud_network.cluster.id
    ip         = "10.0.1.2"
  }

  depends_on = [hcloud_network_subnet.nodes, null_resource.wait_for_k3s]
}

# --- Frontend Object Storage ---

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend"
}

resource "aws_s3_bucket_acl" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  acl    = "public-read"
}
