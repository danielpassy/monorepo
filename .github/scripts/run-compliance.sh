#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

if git ls-files '*.env' | grep -q .; then
  echo "Committed .env files are not allowed"
  git ls-files '*.env'
  exit 1
fi

if git grep -nE 'AKIA[0-9A-Z]{16}' -- . ':!*.lock' >/dev/null; then
  echo "Potential AWS access key detected"
  git grep -nE 'AKIA[0-9A-Z]{16}' -- . ':!*.lock'
  exit 1
fi

echo "Compliance checks passed"
