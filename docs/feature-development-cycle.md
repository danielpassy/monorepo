# Feature Development Cycle

Use this process for feature work unless the user explicitly asks for a smaller direct change.

All relevant docs for a feature project must live under:

```text
docs/projects/{project-name}/
```

Use a short kebab-case project name, for example `session-notes-export`.

Expected project files:

- `product-plan.md`
- `technical-plan.md`
- `contract.md`, when more than one app or package must agree on behavior
- `verification.md`
- `review-notes.md`

Do not scatter feature-specific plans, contracts, review notes, or verification notes outside this directory.

## 1. Product And Design Plan

Create `docs/projects/{project-name}/product-plan.md` before implementation. It must be a Markdown checklist so a human can review each point one by one.

The main agent owns this step. Do not delegate product/design planning to a subagent unless the user explicitly asks for parallel product exploration.

Cover:

- user-facing behavior
- screens and states
- frontend interactions
- backend or API requirements
- acceptance criteria

Use checkbox lists for all commitments:

```md
- [ ] The user can ...
- [ ] The screen shows ...
- [ ] The empty state handles ...
- [ ] The API supports ...
- [ ] Acceptance: ...
```

Stop after this step and wait for human acceptance before creating the technical plan.

## 2. Technical Plan

After the product/design plan is accepted, create `docs/projects/{project-name}/technical-plan.md`.

Technical planning must be performed by relevant planning subagents:

- frontend planner: receives `product-plan.md`, reads `apps/frontend/AGENTS.md` and `docs/frontend-structure.md`, then reviews the existing frontend code before proposing changes
- backend planner: receives `product-plan.md`, reads `docs/backend-structure.md`, then reviews the existing backend code before proposing changes
- agent/shared/infra planner: use only when those areas are involved; each planner must read the relevant local instructions and inspect existing code before proposing changes

Use one subagent per touched area. For a frontend/backend feature, run at least the frontend planner and backend planner.

The main agent owns assembling `technical-plan.md` from the subagent outputs. Each planner must write findings that the main agent incorporates into the technical plan. The plan must cover:

- frontend changes
- backend changes
- shared contracts or protobuf changes
- tests
- migrations
- documentation updates
- verification steps

Keep the relevant app-level agent instructions and architecture docs in context while planning.

## 3. Contract Plan

When frontend and backend both change, create `docs/projects/{project-name}/contract.md`.

The main agent owns this step. The contract is the reconciliation point between planner subagents. Compare the frontend and backend planner outputs, resolve mismatches here, and make the side-specific technical plans reference the agreed contract.

It should define:

- API endpoints, methods, request bodies, responses, and errors
- generated client or OpenAPI changes
- frontend mock shapes and scenarios
- backend validation, persistence, permissions, and side effects
- compatibility or migration requirements

The frontend and backend plans must agree with this file before implementation starts. If they disagree, update `contract.md` first, then revise the side-specific technical plans.

## 4. Frontend Mock Loop

For frontend work:

- mock the frontend behavior first
- add browser-level tests with Playwright or Cypress
- add unit tests where useful
- implement the UI against mocked data
- provide human verification instructions for the mocked experience

The mocked experience should be usable by a human before the backend implementation is required.

Frontend implementation may be done by the main agent or by a frontend implementation subagent. In either case, the code-writing agent must have `product-plan.md`, `technical-plan.md`, `contract.md` when present, `apps/frontend/AGENTS.md`, and `docs/frontend-structure.md` in context.

## 5. Backend TDD Loop

For backend work:

- write failing tests first
- implement the backend behavior
- update contracts, serializers, tasks, permissions, or integrations as needed
- run targeted backend tests

Backend implementation should follow the local backend architecture and testing conventions.

Backend implementation may be done by the main agent or by a backend implementation subagent. In either case, the code-writing agent must have `product-plan.md`, `technical-plan.md`, `contract.md` when present, and `docs/backend-structure.md` in context.

## 6. Pull Request

Create the PR with:

- product/design plan
- technical plan
- contract plan, when present
- test results
- human verification steps

## 7. CI Verification

Wait for CI to finish and confirm all required checks pass.

CI verification must be handled by a CI verification subagent when a PR exists. The CI verification subagent must load:

- `product-plan.md`
- `technical-plan.md`
- `contract.md`, when present
- relevant app-level instructions
- relevant architecture docs
- PR diff
- CI logs and check results

Write results and any follow-up actions to `docs/projects/{project-name}/verification.md`.

## 8. Review Loop

Run multiple independent code-review subagents against the full diff.

Each reviewer must receive:

- the product/design plan
- the technical plan
- the contract plan, when present
- relevant project guidelines
- the PR diff

Read the reviews, write the findings to `docs/projects/{project-name}/review-notes.md`, apply relevant changes, and keep the project guidelines in context while resolving feedback.

## 9. Hand Back To Human

When reviews are resolved and CI is green, summarize:

- what changed
- what was tested
- what reviewers found
- any remaining risks or decisions for the human
