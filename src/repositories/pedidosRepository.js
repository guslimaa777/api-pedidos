// Camada de acesso a dados. Hoje guarda tudo em memória (array);
// se um banco for adotado, só este arquivo precisa mudar.

let pedidos = [];
let proximoId = 1;

function listar(filtros = {}) {
  // Devolve cópias para que ninguém altere o "banco" sem passar pelo repositório.
  return pedidos
    .filter((pedido) =>
      Object.entries(filtros).every(([campo, valor]) => pedido[campo] === valor)
    )
    .map((pedido) => ({ ...pedido }));
}

function buscarPorId(id) {
  const pedido = pedidos.find((p) => p.id === id);
  return pedido ? { ...pedido } : null;
}

function criar(dados) {
  const pedido = { id: proximoId++, ...dados };
  pedidos.push(pedido);
  return { ...pedido };
}

function atualizar(id, campos) {
  const indice = pedidos.findIndex((p) => p.id === id);
  if (indice === -1) return null;
  pedidos[indice] = { ...pedidos[indice], ...campos };
  return { ...pedidos[indice] };
}

// Usado apenas pelos testes para começar cada cenário do zero.
function limpar() {
  pedidos = [];
  proximoId = 1;
}

module.exports = { listar, buscarPorId, criar, atualizar, limpar };
