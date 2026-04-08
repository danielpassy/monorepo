# Estrutura do Frontend

## API Client

### Estrutura de arquivos

```
src/api/
  client.ts       ← base fetch com URL, credentials e interceptação de 401
  auth.ts         ← getMe() e outras funções de auth
  pacientes.ts    ← getPacientes(), getPaciente(id), ...

src/hooks/
  useMe.ts        ← useQuery wrapping getMe()
  usePacientes.ts ← useQuery wrapping getPacientes(), ...

src/mocks/
  auth.ts         ← MSW handlers espelhando src/api/auth.ts
  pacientes.ts    ← MSW handlers espelhando src/api/pacientes.ts
```

### Convenções

- Funções em `src/api/` são async puras — sem lógica de UI, sem hooks
- Hooks em `src/hooks/` são wrappers finos de TanStack Query — sem lógica de negócio
- Componentes nunca fazem `fetch` diretamente — sempre via hooks

### Estado do usuário

- Sem React Context para dados do usuário
- TanStack Query é o store: `useMe()` retorna o usuário cacheado
- Qualquer componente que precise do usuário chama `useMe()`

## Proteção de rotas

### Route guard

- Aplicado a todas as rotas protegidas
- Usa `useMe()` para verificar sessão antes de renderizar
- Redireciona para `/login` se não autenticado (401)

### Global fetch interceptor

- Intercepta respostas de todas as chamadas à API
- Se receber `401`, redireciona para `/login`
- Cobre casos onde a sessão expira após o carregamento da página

## Mocking

- MSW ativado via env var em dev, desativado em produção
- Intercepta na camada de rede — o API client não muda
- Handlers em `src/mocks/` espelham `src/api/`
