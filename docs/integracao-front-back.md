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
