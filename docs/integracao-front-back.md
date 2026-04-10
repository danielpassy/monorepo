# Integração Front e Back

## 1. Auth

### Requisitos do Backend

- Authlib instalado e configurado com `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
  - Ambos tratados como secrets: `secrets.txt.enc` + K8s `secretKeyRef` + Pydantic `BaseSettings`
  - Adicionados ao `.env.example` para referência local
- Callback URL registrada no Google Cloud Console:
  - Local: `http://localhost:5000/auth/google/callback`
  - Produção: `https://api.rafaellapontes.com.br/auth/google/callback`
- Session store: Redis (instância existente), implementação custom
  - Login: gera `session_id` (UUID), armazena `{session_id: user_data}` no Redis com TTL de 7 dias
  - Cookie HTTP-only com `session_id` assinado
  - Auth middleware lê o cookie, consulta Redis, injeta usuário no request state
  - Logout: fora do escopo por ora
- User model no banco para persistir dados do Google na primeira autenticação:
  - `id`, `email`, `name`, `google_id`

### Estratégia

- Sem provedor externo — auth próprio
- Google OAuth via `Authlib`
- Sessão stateful + cookie HTTP-only
- Dados do usuário no banco local

### Fluxos

#### Login (Google OAuth)

- `GET /auth/google` — redireciona para o consent screen do Google
- `GET /auth/google/callback` — Google redireciona aqui com `code`; backend troca pelo token, cria sessão, seta cookie, redireciona para `/dashboard`

#### Sessão atual

- `GET /auth/me`
- Output:
  - `200` → user
  - `401` → não autenticado

#### Logout

- `POST /auth/logout`
- Output:
  - `200 OK`
  - Cookie invalidado

### Acceptance Criteria

#### Login

- [ ] Login page has a "Login with Google" button
- [ ] On success → redirect to dashboard
- [ ] On failure (consent denied or account not allowed) → error message above the button

#### Session

- [ ] `GET /auth/me` returns user data if session is active
- [ ] `GET /auth/me` returns 401 if not authenticated

#### Route protection

- [ ] Protected routes check session via route guard before rendering
- [ ] 401 from any API call redirects to login page
- [ ] Unauthenticated access to protected route redirects to login

#### Cookie / Security

- [ ] Session cookie is HTTP-only
- [ ] CSRF protection in place
- [ ] SameSite policy defined (Lax or Strict)
- [ ] Secure flag enabled in production

---

## 2. Estrutura do Frontend

### API Client

- `src/api/client.ts` — base fetch com URL, credentials e interceptação de 401
- Módulos por domínio exportam funções async puras (sem hooks, sem lógica de UI)
- Hooks em `src/hooks/` são wrappers finos de TanStack Query sobre essas funções
- TanStack Query é o store — sem React Context para dados do servidor
- Componentes nunca fazem `fetch` diretamente — sempre via hooks

Ver estrutura completa em [frontend-structure.md](frontend-structure.md).

### Proteção de rotas

- **Route guard** — impede acesso a rotas protegidas sem sessão ativa
- **Global fetch interceptor** — captura 401s em chamadas feitas após o carregamento da página e redireciona para login

### Acceptance Criteria

#### API Client

- [ ] `src/api/client.ts` exists with base URL, credentials, and 401 interceptor
- [ ] All API calls go through the client — no direct `fetch` in components
- [ ] 401 response redirects to login
- [ ] `src/hooks/` has one hook per API function, wrapping TanStack Query
- [ ] No React Context used for server state
- [ ] `useMe()` returns cached user data from `GET /auth/me`

Ver detalhes em [frontend-structure.md](frontend-structure.md).

---

## 3. Mocking

### MSW

- Ativado via env var em dev, desativado em produção
- Intercepta na camada de rede — o API client não muda
- Handlers espelham a estrutura de `src/api/`:
  ```
  src/mocks/
    auth.ts
    pacientes.ts
  ```
- Define e valida o contrato da API durante desenvolvimento

### Acceptance Criteria

- [ ] MSW enabled in dev via env var, disabled in prod
- [ ] Each domain module in `src/api/` has a corresponding handler in `src/mocks/`
- [ ] Switching between mock and real backend requires only an env var change

---

## 4. Codegen (Type-Safe API Client)

### Estratégia

- FastAPI gera schema OpenAPI automaticamente
- Schema commitado em `apps/web/openapi.json` — fonte da verdade
- Hey API (`@hey-api/openapi-ts`) gera `src/api/generated/` a partir do schema
- `src/api/generated/` é gitignored — nunca editado manualmente
- `src/api/client.ts` configura o client gerado (baseUrl, credentials, interceptor 401)

### Fluxo local

```
FastAPI → apps/web/openapi.json (commitado)
  → openapi-ts → src/api/generated/ (gerado, gitignored)
  → src/api/client.ts (configuração manual, commitado)
```

### CI — Backend

- Sobe o FastAPI, exporta `/openapi.json`
- Diff contra `apps/web/openapi.json` commitado
- Falha se houver diferença — força atualização do schema

### CI — Frontend

- Roda codegen a partir de `apps/web/openapi.json`
- Roda `vp check` para verificar tipos
- Falha se houver erros de tipo

### Acceptance Criteria

- [ ] `apps/web/openapi.json` commitado e atualizado a cada mudança de endpoint
- [ ] `src/api/generated/` está no `.gitignore`
- [ ] Backend CI falha se `openapi.json` estiver desatualizado
- [ ] Frontend CI roda codegen + `vp check` e falha em erros de tipo
- [ ] Codegen roda como pré-build step localmente

---

## 6. Requisitos para implementar as features mockadas

### Objetivo

Implementar no backend as features que hoje existem só no frontend mockado e integrar o frontend aos endpoints reais.

Fontes atuais no frontend:

- `apps/frontend/src/lib/patient-store.tsx`: estado local de pacientes e sessões
- `apps/frontend/src/lib/mock-data.ts`: fixtures de pacientes e sessões
- `apps/frontend/src/lib/mock-ai.ts`: geração fake de resumo
- `apps/frontend/src/lib/types/therapy.ts`: tipos atuais da UI

### Fora de escopo

- Não criar `status` em `sessions`
- Não criar campo de transcription provider
- Não duplicar therapist/client em linhas ou registros de transcrição
- Não escolher o modelo final de transcrição agora
- Não implementar upload real para storage externo se isso ainda não existir no repo

### Backend requirements

#### Arquitetura

Seguir `docs/backend-structure.md`:

- criar models SQLAlchemy async
- criar migration Alembic
- criar Pydantic schemas nos controllers
- colocar regra de negócio em services
- registrar endpoints via router
- gerar/atualizar OpenAPI
- cobrir endpoints com TestClient
- cobrir regras principais em testes de service

#### PostgreSQL models

`clients`

- `id`: `uuid`, primary key
- `name`: `text`, not null
- `email`: `text`, nullable
- `phone`: `text`, nullable
- `start_date`: `date`, not null
- `created_at`: `timestamptz`, not null
- `updated_at`: `timestamptz`, not null

`sessions`

- `id`: `uuid`, primary key
- `client_id`: `uuid`, foreign key para `clients.id`, not null
- `therapist_id`: `integer`, foreign key para `users.id`, not null
- `date`: `date`, not null
- `session_number`: `integer`, not null
- `duration_minutes`: `integer`, nullable
- `notes`: `text`, nullable
- `summary`: `text`, nullable
- `created_at`: `timestamptz`, not null
- `updated_at`: `timestamptz`, not null

`session_transcript_entries`

- `id`: `uuid`, primary key
- `session_id`: `uuid`, foreign key para `sessions.id`, not null
- `status`: `text`, not null, valores permitidos: `waiting_to_be_processed`, `processing`, `processed`, `failed`
- `audio_files`: `text[]`, not null, default `{}`
- `transcript`: `text`, nullable
- `created_at`: `timestamptz`, not null
- `updated_at`: `timestamptz`, not null

Constraints:

- `sessions` deve ter índice em `client_id`
- `sessions` deve ter unique constraint em `(client_id, session_number)`
- `session_transcript_entries` deve ter índice em `session_id`
- deletar `client` deve deletar suas `sessions` e `session_transcript_entries`

#### Backend API

Clients:

- `GET /clients`: lista clientes
- `POST /clients`: cria cliente
- `GET /clients/{client_id}`: detalha cliente
- `PATCH /clients/{client_id}`: atualiza cliente
- `DELETE /clients/{client_id}`: remove cliente e dependências

Sessions:

- `GET /clients/{client_id}/sessions`: lista sessões do cliente ordenadas por `session_number desc`
- `POST /clients/{client_id}/sessions`: cria sessão e calcula o próximo `session_number`
- `GET /sessions/{session_id}`: retorna sessão completa
- `PATCH /sessions/{session_id}`: atualiza `date`, `duration_minutes`, `notes`, `summary`
- `DELETE /sessions/{session_id}`: remove sessão e transcrições

Transcript entries:

- `GET /sessions/{session_id}/transcript-entries`: lista transcrições da sessão
- `POST /sessions/{session_id}/transcript-entries`: cria uma transcrição com `audio_files`
- `GET /session-transcript-entries/{entry_id}`: detalha uma transcrição
- `PATCH /session-transcript-entries/{entry_id}`: atualiza `status`, `audio_files` e `transcript`

Summary:

- `POST /sessions/{session_id}/summary/generate`: gera resumo usando `notes` e as transcrições da sessão
- Se ainda não houver integração real com modelo, manter a lógica isolada em service para trocar depois

#### Backend acceptance criteria

- [ ] Models e migration Alembic criados
- [ ] `sessions` não tem coluna `status`
- [ ] `session_transcript_entries.audio_files` é array PostgreSQL (`text[]`)
- [ ] `session_transcript_entries` não tem campo de provider
- [ ] Criar sessão calcula o próximo `session_number`
- [ ] Deletar cliente remove sessões e transcrições relacionadas
- [ ] Endpoints retornam 404 para cliente/sessão/transcrição inexistente
- [ ] OpenAPI atualizado
- [ ] TestClient cobre pelo menos um happy path por endpoint
- [ ] Services cobrem criação de sessão, cascata de delete e atualização de transcrição

### Frontend requirements

#### Arquitetura

Seguir `docs/frontend-structure.md`:

- criar funções async puras em `src/api/`
- criar hooks finos em `src/hooks/` com TanStack Query
- usar tipos gerados de `src/api/generated/`
- manter MSW em `src/mocks/` espelhando a API real
- páginas não devem chamar `fetch` diretamente
- server state não deve viver em React Context

#### Mudanças no frontend

- Remover `status` do tipo de `Session`
- Trocar `PatientStoreProvider` por hooks baseados nos endpoints reais
- Migrar home para buscar clientes via hook
- Migrar página de sessão para buscar cliente, sessão e transcript entries via hooks
- Migrar criação/deleção de cliente para mutations
- Migrar criação/deleção de sessão para mutations
- Migrar edição de `notes` e `summary` para mutations em `PATCH /sessions/{session_id}`
- Migrar geração de resumo para `POST /sessions/{session_id}/summary/generate`
- Migrar mocks para MSW mantendo o mesmo contrato do OpenAPI

#### Frontend acceptance criteria

- [ ] Home renderiza clientes vindos da API/hook
- [ ] Criar cliente persiste via API e atualiza cache
- [ ] Criar sessão persiste via API e navega para a sessão criada
- [ ] Deletar sessão atual redireciona para outra sessão válida ou para a home
- [ ] Notas e resumo sobrevivem a reload
- [ ] `mock-ai.ts` não é usado no fluxo principal
- [ ] `mock-data.ts` não é obrigatório para o fluxo principal
- [ ] Nenhum componente faz `fetch` direto
- [ ] MSW permite rodar a suíte sem backend real
- [ ] Testes de página cobrem home e sessão com mocks
