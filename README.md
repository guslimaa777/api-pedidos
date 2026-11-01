# API de Gerenciamento de Pedidos

API REST para gerenciar pedidos de uma pequena loja, feita em **Node.js + Express** com
arquitetura em camadas, validação de dados, tratamento centralizado de erros e testes
automatizados com **Jest**.

Projeto prático avaliativo — Tópicos Avançados em Sistemas de Informação II.

---

## Sumário

1. [Instalação e execução](#instalação-e-execução)
2. [Rotas](#rotas)
3. [Valores aceitos e regras de validação](#valores-aceitos-e-regras-de-validação)
4. [Regras de transição de status](#regras-de-transição-de-status)
5. [Respostas de erro](#respostas-de-erro)
6. [Arquitetura](#arquitetura)
7. [Testes](#testes)
8. [Evidências (Postman)](#evidências-postman)
9. [Uso de IA](#uso-de-ia)

---

## Instalação e execução

Pré-requisito: Node.js 18 ou superior.

```bash
npm install
npm start
```

A API sobe em `http://localhost:3000` (pode ser alterado pela variável `PORT`).

| Comando | O que faz |
|---|---|
| `npm start` | Inicia o servidor |
| `npm run dev` | Inicia com recarga automática ao salvar arquivos (`node --watch`) |
| `npm test` | Executa os testes automatizados |

> Os dados ficam **em memória**: ao reiniciar o servidor, os pedidos são apagados e os ids
> voltam a começar em 1.

---

## Rotas

| Método | Rota | Descrição | Respostas |
|---|---|---|---|
| `POST` | `/pedidos` | Cadastra um pedido (RF01) | `201` criado · `400` dados inválidos |
| `GET` | `/pedidos` | Lista os pedidos (RF02) | `200` |
| `GET` | `/pedidos/:id` | Consulta um pedido (RF03) | `200` encontrado · `404` inexistente |
| `PATCH` | `/pedidos/:id/status` | Atualiza o status (RF04) | `200` atualizado · `400` inválido · `404` inexistente |

### `POST /pedidos`

Requisição:

```json
{
  "cliente": "Carlos Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal"
}
```

Resposta `201 Created`:

```json
{
  "id": 1,
  "cliente": "Carlos Silva",
  "tipo": "entrega",
  "valor": 350,
  "prioridade": "normal",
  "status": "recebido"
}
```

- O `id` é gerado pela API (sequencial) e todo pedido nasce com status `recebido`.
- Campos extras enviados no corpo (inclusive `id` e `status`) são **ignorados**.

### `GET /pedidos`

Resposta `200 OK` — array com todos os pedidos (vazio `[]` se não houver nenhum).

### `GET /pedidos/:id`

Resposta `200 OK` com o pedido, ou `404 Not Found`:

```json
{ "erro": "Pedido com id 9999 não encontrado." }
```

### `PATCH /pedidos/:id/status`

Requisição:

```json
{ "status": "em_preparacao" }
```

Resposta `200 OK` com o pedido atualizado. Apenas o campo `status` é alterado; outros campos
enviados no corpo são ignorados.

---

## Valores aceitos e regras de validação

| Campo | Regra |
|---|---|
| `cliente` | Obrigatório. Texto não vazio, mesmo após remover espaços das extremidades. É salvo já sem esses espaços (`"  Ana  "` → `"Ana"`). |
| `tipo` | `entrega` ou `retirada` |
| `valor` | Número (tipo `number` no JSON) maior que zero. Decimais são aceitos (`10.5`). Texto como `"350"` é **rejeitado**. |
| `prioridade` | `baixa`, `normal` ou `alta` |
| `status` | `recebido`, `em_preparacao`, `enviado`, `entregue` ou `cancelado` |
| `:id` | Inteiro positivo. Valores como `abc`, `0`, `-1` ou `1.5` nunca correspondem a um pedido e retornam `404`. |

Os valores aceitos estão definidos em um único lugar: [`src/config/regras.js`](src/config/regras.js).

---

## Regras de transição de status

```
recebido ──► em_preparacao ──► enviado ──► entregue
   │               │
   └──► cancelado ◄┘
```

| Status atual | Pode ir para |
|---|---|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | — (final) |
| `cancelado` | — (final) |

Justificativa:

- Um pedido só pode ser **cancelado antes de sair da loja**. Depois de `enviado`, ele já está
  com o entregador; cancelar exigiria um fluxo de devolução, que está fora do escopo.
- `entregue` e `cancelado` são **finais**: não faz sentido "reabrir" um pedido concluído.
- Não é possível **pular etapas** (ex.: `recebido` → `entregue`) nem **repetir o status atual**.

Transições não permitidas retornam `400`, com mensagem que diz quais status são aceitos a partir
do atual:

```json
{
  "erro": "Transição de status inválida: \"recebido\" -> \"entregue\" (a partir de \"recebido\" só é permitido: em_preparacao, cancelado)."
}
```

**Ordem das verificações no PATCH:** primeiro a API verifica se o pedido existe (`404`) e só
depois valida o corpo (`400`). Assim, um id inexistente sempre retorna `404`, mesmo que o corpo
também esteja errado.

---

## Respostas de erro

Todos os erros retornam JSON com a chave `erro`.

| Situação | HTTP | Exemplo |
|---|---|---|
| Dados inválidos no cadastro | `400` | ver abaixo |
| Status inválido / transição não permitida | `400` | `{ "erro": "Status inválido.", "detalhes": [...] }` |
| JSON mal formado no corpo | `400` | `{ "erro": "JSON inválido no corpo da requisição." }` |
| Pedido inexistente | `404` | `{ "erro": "Pedido com id 9999 não encontrado." }` |
| Rota inexistente | `404` | `{ "erro": "Rota GET /produtos não encontrada." }` |
| Erro inesperado no servidor | `500` | `{ "erro": "Erro interno do servidor." }` |

Exemplo de `400` no cadastro — a API devolve **todos** os campos com problema de uma vez:

```json
{
  "erro": "Dados do pedido inválidos.",
  "detalhes": [
    { "campo": "cliente", "mensagem": "cliente é obrigatório e deve ser um texto não vazio." },
    { "campo": "valor", "mensagem": "valor deve ser numérico e maior que zero." }
  ]
}
```

**Erros do usuário x erros inesperados:** validações e "não encontrado" lançam erros próprios
(`ValidationError`, `NotFoundError`, que herdam de `AppError` e carregam o código HTTP). Qualquer
outro erro é considerado falha interna: o middleware registra no console e responde `500` com
mensagem genérica, sem expor stack trace ao cliente.

---

## Arquitetura

Padrão adotado: **arquitetura em camadas** (Routes → Controller → Service → Repository), com
tratamento de erros centralizado em middleware.

```
src/
├── server.js                      # Sobe o servidor (app.listen)
├── app.js                         # Monta o Express: JSON, rotas e middlewares de erro
├── routes/pedidosRoutes.js        # Liga método + caminho à função do controller
├── controllers/pedidosController.js  # Camada HTTP: lê req, chama service, define status da resposta
├── services/pedidosService.js     # Regras de negócio (status inicial, transições, 404)
├── validators/pedidoValidator.js  # Validação de formato/valores dos dados de entrada
├── repositories/pedidosRepository.js # Armazenamento em memória (array)
├── middlewares/errorHandler.js    # 404 de rota e conversão de erros em respostas HTTP
├── errors/AppError.js             # Classes de erro com código HTTP
└── config/regras.js               # Tipos, prioridades, status e transições aceitos
tests/
├── pedidos.api.test.js            # Testes de integração (HTTP, com supertest)
└── pedidos.service.test.js        # Testes unitários da camada de serviço
postman/
└── API-Pedidos.postman_collection.json
evidencias/                        # Prints do Postman
```

### Responsabilidade de cada camada

| Camada | Faz | Não faz |
|---|---|---|
| **Routes** | Define endpoints | Nenhuma lógica |
| **Controller** | Traduz HTTP ↔ service; escolhe 200/201; repassa erros com `next(erro)` | Regras de negócio, acesso a dados |
| **Service** | Regras de negócio: status inicial, transições permitidas, pedido inexistente | Não conhece `req`/`res` |
| **Validator** | Verifica tipos e valores aceitos; normaliza (`trim`) | Não sabe o estado do pedido |
| **Repository** | Guarda e recupera pedidos; gera ids | Nenhuma regra de negócio |
| **Middleware de erro** | Converte erros em respostas JSON com o status correto | — |

### Pastas adicionais (além de routes/controllers/services) e por quê

- **`repositories/`** — isola o armazenamento. Hoje é um array; trocar por banco de dados
  mudaria só este arquivo. Também devolve cópias dos objetos, para que nenhuma outra camada
  altere os dados sem passar por ele.
- **`validators/`** — separa "o dado está no formato certo?" (validator) de "a operação é
  permitida agora?" (service, ex.: transições).
- **`middlewares/` e `errors/`** — um único ponto trata todos os erros. Os controllers não
  precisam montar respostas de erro, e a diferença entre erro do usuário (400/404) e erro
  inesperado (500) fica explícita.
- **`config/`** — listas de valores aceitos em um só lugar, usadas pela validação, pelas regras
  e pelas mensagens de erro.

### Fluxo de uma requisição (exemplo: `PATCH /pedidos/1/status`)

1. `routes` encaminha para `controller.atualizarStatus`.
2. O controller chama `service.atualizarStatus("1", req.body)`.
3. O service busca o pedido (`404` se não existir), valida o status (`400` se desconhecido) e
   verifica se a transição é permitida (`400` se não for).
4. O repository grava o novo status.
5. O controller responde `200` com o pedido. Se algo deu errado, o erro vai por `next(erro)` ao
   middleware, que responde com o código adequado.

---

## Testes

```bash
npm test
```

São 46 testes em dois arquivos:

- **`tests/pedidos.api.test.js`** (integração) — usa **supertest** para fazer requisições HTTP
  ao app sem abrir porta. Cobre todas as rotas e códigos de resposta: criação válida, cada
  regra de validação (cliente vazio/só espaços, valor zero/negativo/texto, tipo e prioridade
  desconhecidos), JSON mal formado, listagem, consulta de ids inexistentes e mal formados,
  fluxo completo de status, transições proibidas, 404 no PATCH e erro inesperado virando 500
  (simulado com `jest.spyOn`).
- **`tests/pedidos.service.test.js`** (unitário) — chama o service diretamente, sem HTTP,
  mostrando que as regras de negócio não dependem do Express.

Antes de cada teste o armazenamento é zerado (`repository.limpar()`), para que um teste não
interfira no outro.

---

## Evidências (Postman)

A coleção [`postman/API-Pedidos.postman_collection.json`](postman/API-Pedidos.postman_collection.json)
tem as requisições dos cenários obrigatórios (01 a 05) e alguns extras, já com testes de status.
Importe no Postman, suba a API com `npm start` e execute na ordem.

Capturas em [`evidencias/`](evidencias/):

| Arquivo | Cenário |
|---|---|
| `01-criacao.png` | POST válido → 201 |
| `02-validacao.png` | POST inválido → 400 |
| `03-listagem.png` | GET da lista → 200 |
| `04-consulta-inexistente.png` | GET de id inexistente → 404 |
| `05-atualizacao.png` | PATCH de status válido → 200 |

---

## Uso de IA

> ✏️ **Revisar e completar com a sua experiência real antes de entregar.**

- **Utilizei IA?** Sim — Claude (Anthropic).
- **Para quais tarefas:** geração da estrutura inicial do projeto em camadas, dos testes com
  Jest/supertest, da coleção do Postman e do rascunho deste README.
- **O que fiz depois:** _descreva aqui como você revisou, executou e testou o código (ex.: rodou
  `npm test`, testou no Postman com entradas próprias, leu cada camada)._

**Exemplos de sugestões avaliadas** (mantenha os que refletem sua decisão e ajuste a justificativa):

- **Aceita:** retornar `404` (e não `400`) para ids mal formados como `abc` em `GET /pedidos/:id`.
  Justificativa: o enunciado pede 404 para "identificadores inexistentes", e um id que não é
  inteiro positivo nunca pode existir.
- **Modificada:** _ex.: a primeira versão aceitava `"350"` (texto) como valor; alterei para
  aceitar apenas número, porque o enunciado exige valor numérico e a conversão automática
  esconderia erro do cliente._
- **Rejeitada:** _ex.: usar HTTP 409 (Conflict) para transições de status inválidas; mantive 400
  porque o enunciado define apenas 400 para dados inválidos no PATCH e queria que o
  comportamento batesse com a especificação._
