output "server_ip" {
  description = "Public IP of the k3s server node"
  value       = hcloud_server.server.ipv4_address
}

output "agent_ip" {
  description = "Public IP of the k3s agent node"
  value       = hcloud_server.agent.ipv4_address
}

output "kubeconfig" {
  description = "Kubeconfig for the k3s cluster (use: terraform output -raw kubeconfig > ~/.kube/monorepo)"
  value       = replace(data.remote_file.kubeconfig.content, "127.0.0.1", hcloud_server.server.ipv4_address)
  sensitive   = true
}
