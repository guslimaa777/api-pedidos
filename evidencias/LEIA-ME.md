# Evidências (Postman)

Coloque nesta pasta as capturas de tela tiradas no Postman, mostrando
**método, URL, corpo da requisição (quando houver), resposta e código HTTP**.

| Arquivo | Requisição da coleção `postman/API-Pedidos.postman_collection.json` |
|---|---|
| `01-criacao.png` | 01 - Criar pedido válido (201) |
| `02-validacao.png` | 02 - Criar pedido inválido (400) |
| `03-listagem.png` | 03 - Listar pedidos (200) |
| `04-consulta-inexistente.png` | 04 - Consultar pedido inexistente (404) |
| `05-atualizacao.png` | 05 - Atualizar status válido (200) |

Execute na ordem acima com a API rodando (`npm start`). Como os dados ficam em
memória, reiniciar o servidor zera os pedidos e os ids voltam a começar em 1.
