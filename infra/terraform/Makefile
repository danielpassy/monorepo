DOCKER_IMAGE := hashicorp/terraform:latest
SSH_PRIV     := $(HOME)/.ssh/id_ed25519

TF = docker run --rm -it \
	--env-file $(CURDIR)/.env \
	-e TF_VAR_ssh_private_key_path=/root/.ssh/id_ed25519 \
	-v $(CURDIR):/workspace \
	-v $(SSH_PRIV):/root/.ssh/id_ed25519:ro \
	-w /workspace \
	$(DOCKER_IMAGE)

.PHONY: init plan apply destroy output help

init: ## Initialize Terraform providers
	$(TF) init

plan: ## Preview infrastructure changes (saves to tfplan)
	$(TF) plan -out=tfplan

apply: ## Apply infrastructure changes (uses saved plan if available)
	$(TF) apply tfplan

destroy: ## Destroy all infrastructure
	$(TF) destroy

output: ## Show Terraform outputs
	$(TF) output

kubeconfig: ## Save kubeconfig to ~/.kube/monorepo
	$(TF) output -raw kubeconfig > $(HOME)/.kube/monorepo
	@echo "Saved to ~/.kube/monorepo"
	@echo "Run: export KUBECONFIG=~/.kube/monorepo"

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
