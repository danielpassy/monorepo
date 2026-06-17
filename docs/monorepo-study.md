# Estudo de Monorepo — Problemas e Desafios

Documento de estudo dos desafios reais do padrão monorepo, no contexto de uma
empresa de porte médio (não Google-scale). Cada desafio é descrito com o
problema, por que o monorepo o causa ou amplifica, e como se lida.

Repos públicos usados como referência:

- [zulip/zulip](https://github.com/zulip/zulip) — Django + JS, versionamento de API explícito (`feature_level`).
- [PostHog/posthog](https://github.com/PostHog/posthog) — Django + React, uso intensivo de feature flags. Clone local em `../posthog`.
- [getsentry/sentry](https://github.com/getsentry/sentry) — Django + React, política formal de deprecation de API.

---

## 1. Retrocompatibilidade durante o deploy

PR atômico ≠ deploy atômico. Durante rollout sempre há coexistência:
- Rolling update do k8s mantém pods velhos e novos do mesmo serviço servindo
  simultaneamente.
- Entre serviços, um sobe antes do outro — não existe deploy transacional.
- Browsers carregam frontend velho enquanto backend novo já está no ar.

**Por que o monorepo amplifica:** "tudo no mesmo commit" disfarça. CI testa
só `novo + novo` e passa; a incompatibilidade aparece só em produção.

**Padrão: expand / contract (parallel change).** Uma mudança vira três
deploys independentes:
1. **Expand** — servidor aceita velho e novo.
2. **Migrate** — cliente passa a usar o novo.
3. **Contract** — remove o velho do servidor.

Casos:
- Renomear campo: adiciona novo, escreve nos dois, migra leitura, remove velho.
- `DROP COLUMN`: nunca no mesmo deploy que para de escrever.
- Remover endpoint: marca deprecated, mede uso, remove.

**Como testar no monorepo (não vem de graça):**
- **Diff de contrato como gate** — breaking change no schema bloqueia merge.
- **Job de cross-version** — subir backend do PR + frontend do `main`
  (e vice-versa) e rodar smoke test.
- **Contract testing (Pact-style)** — consumidor grava expectativas, CI do
  produtor verifica contra contrato anterior.
- **Feature flags** — PR atômico, comportamento gateado.

**Dois backends com k8s:** sem deploy síncrono. Existe **deploy ordenado**:
A (em modo expand) primeiro, healthy, então B. K8s nunca é atômico nem pra
um serviço só — rolling update já obriga retrocompat com você mesmo.

**Referências:**
- Zulip — `feature_level` no protocolo cliente↔servidor.
- Sentry — cabeçalho `X-Sentry-Deprecation`, endpoints velhos mantidos por meses.
- PostHog — feature flags do próprio produto pra gatear rollouts.

---

## 2. Monolito modular (caso Django do PostHog)

Estrutura: cada produto em `products/<nome>/{backend,frontend}`. Todos os
backends entram no mesmo Django, deploy é uma imagem só. Isolamento é
**lógico**, não de processo.

**Enforcement em camadas:**
- **Tach** (`tach.toml`) — proíbe imports cruzados no nível estático.
- **Banco por produto** (`db_routing.yaml` + `ProductDBRouter`) — Postgres
  não atravessa databases, impossível `JOIN` cross-product.
- **Facade + frozen dataclasses** — único ponto de contato entre produtos.
- **`backend:contract-check`** obrigatório em produtos isolados; lint quebra
  o PR se sumir.
- **Vertical slice** = `CODEOWNERS` trivial (pasta do produto = dono).

**Mover modelo entre produtos sem perder dados:** `SeparateDatabaseAndState`
nas migrations (atualiza state do Django, não toca no banco).

**Vantagens:** um deploy, sem rede entre módulos, sem N pipelines/alertas.

**Problemas:**
- Startup local lento, footprint de memória alto.
- CI fica lento se "isolated" não estiver bem configurado (suite Django
  inteira roda).
- **Signals/middleware/settings** fogem do Tach — acoplam por string ou
  config global.
- Migrations no DB compartilhado: travamento em uma trava todas.
- Eventual consistency obrigatória cross-product (sem `transaction.atomic()`
  cross-DB, sem `ON DELETE CASCADE`, sem `select_related` cross-DB).
- Rolling update do k8s ainda obriga retrocompat com você mesmo (ver §1).

---

## 3. Contratos entre serviços via protobuf

Quando saem do monolito (Rust, Go, Node), comunicação é por protobuf
versionado em `proto/<dominio>/v<N>/`. Stubs gerados nas duas pontas, CI
valida.

**Gates no CI (`buf`):**
- `buf lint` — estilo/naming.
- `buf breaking` — checa schema-breaking contra `master`.
- Staleness check — rejeita stubs commitados desatualizados.

**Versão no path (`v1/`, `v2/`)** torna expand/contract trivial: cria
`v2/`, mantém `v1/`, migra clientes, aposenta. Mesma receita do §1.

**O que `buf breaking` NÃO cobre:**

- **Semantic drift** — campo novo é schema-safe, mas cliente velho que
  assume "ausente = comportamento X" pode interpretar errado.
- **Governança** — sem dono central no `proto/`, quem muda é responsável
  por cascatear em todos os consumidores. No PostHog isso é um checklist
  em `proto/AGENTS.md` listando o que tocar em Python/Node/Rust;
  enforcement = doc + staleness check no CI, sem `CODEOWNERS`.

**Outros custos:** stubs commitados geram diff gigante em PR; debug é
binário (precisa `grpcurl`, não dá `curl`).
