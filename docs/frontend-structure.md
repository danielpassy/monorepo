# Estrutura do Frontend

## API Client

### Estrutura de arquivos

```
src/api/
  client.ts       ← base fetch com URL, credentials e interceptação de 401
  generated/      ← client e tipos gerados a partir do OpenAPI
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

- `src/api/generated/` é a fonte de verdade de tipos vindos do backend
- `src/api/*.ts` é uma camada manual e fina sobre o client gerado
- Funções em `src/api/` são async puras — sem lógica de UI, sem hooks
- Hooks em `src/hooks/` são wrappers finos de TanStack Query — sem lógica de negócio
- Componentes nunca fazem `fetch` diretamente — sempre via hooks

### Codegen

- O schema OpenAPI do backend gera `src/api/generated/`
- O frontend não deve declarar manualmente tipos que já existem no schema
- Tipos do backend entram no app pela camada `src/api/generated/` e sobem por `src/api/`, hooks e páginas
- Se for necessário adaptar resposta para a UI, a transformação deve acontecer na camada manual de `src/api/` ou em `src/core/`

## Organização de código

- `src/routes/` para páginas e composição de rota
- `src/components/` para componentes reutilizáveis de UI
- `src/features/` para fluxos de domínio que combinam API, hooks e UI
- `src/core/` para regras reutilizáveis de negócio e transformações puras
- `src/api/` para contratos com o backend
- `src/hooks/` para wrappers de query/mutation
- `src/mocks/` para MSW e cenários de desenvolvimento

## Page Logic

- A página (`page.tsx`) é dona da lógica de renderização daquela tela
- A página decide estados como loading, empty, error e success
- A página orquestra callbacks e composição visual da tela
- Lógica reutilizável sai da página e vai para `src/core/`
- Componentes abaixo da página devem ser, em geral, visuais e sem regra própria

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

## Testes

### Princípios

- A maior parte dos testes do frontend deve evitar testar detalhes de UI
- Testes de página devem validar comportamento visível, não implementação interna
- Testes de contrato devem passar pela camada `src/api/` e pelos mocks
- MSW é a camada principal de isolamento para desenvolvimento e testes locais
- Não testar `fetch` diretamente em componentes; testar hooks e componentes que os consomem

### Tipos de teste

- `logic test`: mocka a chamada de API e verifica retorno, estado e decisões sem renderizar React
- `page test`: renderiza a página, mocka a chamada de API e verifica o resultado visível do fluxo

### Logic test

- Devem focar em decisões, transformações, estado e orquestração
- Devem depender de funções ou camadas testáveis sem DOM
- Se um fluxo de página for importante, a maior parte da cobertura deve estar aqui, não no JSX

### Page test

- Devem ser poucos e cobrir o ciclo visível mais importante
- A página continua sendo a dona da lógica de renderização
- O teste de página verifica o resultado final da tela, não a estrutura interna dos componentes

### Infra de testes de página

- `src/test/page-test-setup.ts` prepara o ambiente global para testes de página
- `src/test/render-page.tsx` renderiza páginas com o mínimo de boilerplate
- Providers não devem ficar escondidos no renderer por padrão
- Wrappers como `withPatientStore` ficam em `src/test/page-wrappers.tsx` e cada teste opta neles explicitamente
- `renderPage(<Page />, { wrappers: [...] })` é o formato preferido para testes de página

### Cobertura por camada

- `src/api/generated/` não deve ter testes manuais; é código gerado
- `src/api/*` deve ter testes de serialização, adaptação de dados, tratamento de erro e integração com o client gerado
- `src/hooks/*` deve ter testes de cache, loading, erro e invalidação
- `src/routes/*` deve ter testes de navegação e proteção de sessão
- `src/mocks/*` deve espelhar o contrato do backend para não divergir da API real
- Os mocks e fixtures devem usar os tipos gerados pelo OpenAPI sempre que possível

### Objetivo

- A suíte deve rodar sem backend real quando MSW estiver ativo
