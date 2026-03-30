variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key for server access"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "ssh_private_key_path" {
  description = "Path to SSH private key (used by provisioners)"
  type        = string
  default     = "~/.ssh/id_ed25519"
}


variable "ci_ssh_public_key_path" {
  description = "Path to CI SSH public key for server access"
  type        = string
  default     = "~/.ssh/monorepo_ci.pub"
}

variable "ssh_allowed_ips" {
  description = "List of IPs allowed to SSH (CIDR notation)"
  type        = list(string)
}
