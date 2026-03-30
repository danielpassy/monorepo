variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "ssh_private_key_path" {
  description = "Path to SSH private key (used by provisioners)"
  type        = string
  default     = "~/.ssh/id_ed25519"
}

variable "ssh_allowed_ips" {
  description = "List of IPs allowed to SSH (CIDR notation)"
  type        = list(string)
}
