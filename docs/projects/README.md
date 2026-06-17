# Project Docs

Store feature-project artifacts in this directory.

Each feature project should use a short kebab-case directory name:

```text
docs/projects/{project-name}/
```

Expected files:

- `product-plan.md` - human-reviewed checkbox plan for product and design behavior
- `technical-plan.md` - implementation plan from the relevant planning agents
- `contract.md` - agreement between frontend, backend, shared, agent, or infra work when boundaries are involved
- `verification.md` - CI, test, and manual verification notes
- `review-notes.md` - code-review agent findings and resolution notes

Do not store feature-specific plans, contracts, review notes, or verification notes outside the feature project's directory.
