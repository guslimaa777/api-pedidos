// Regras de negócio. Não conhece req/res (HTTP): recebe dados e devolve
// resultados ou lança erros. Por isso pode ser testado sem subir o servidor.

const repository = require('../repositories/pedidosRepository');
const {
  validarCriacao,
  validarStatus,
  validarFiltrosListagem,
} = require('../validators/pedidoValidator');
const { STATUS_INICIAL, TRANSICOES } = require('../config/regras');
const { NotFoundError, ValidationError } = require('../errors/AppError');

function converterId(idParam) {
  // Aceita apenas inteiros positivos ("1", "42"). Qualquer outra coisa
  // ("abc", "1.5", "-3") não pode corresponder a um pedido: tratamos como inexistente.
  const texto = String(idParam);
  if (!/^\d+$/.test(texto)) return null;
  const id = Number(texto);
  return id > 0 ? id : null;
}

function criar(dados) {
  const pedidoValido = validarCriacao(dados);
  return repository.criar({ ...pedidoValido, status: STATUS_INICIAL });
}

function listar(query = {}) {
  return repository.listar(validarFiltrosListagem(query));
}

function buscarPorId(idParam) {
  const id = converterId(idParam);
  const pedido = id === null ? null : repository.buscarPorId(id);

  if (!pedido) {
    throw new NotFoundError(`Pedido com id ${idParam} não encontrado.`);
  }

  return pedido;
}

function atualizarStatus(idParam, dados) {
  // 1º confirma que o pedido existe (404), depois valida o corpo (400).
  const pedido = buscarPorId(idParam);
  const novoStatus = validarStatus(dados);

  const permitidos = TRANSICOES[pedido.status];
  if (!permitidos.includes(novoStatus)) {
    const detalhe =
      permitidos.length === 0
        ? `o status "${pedido.status}" é final e não pode ser alterado`
        : `a partir de "${pedido.status}" só é permitido: ${permitidos.join(', ')}`;

    throw new ValidationError(
      `Transição de status inválida: "${pedido.status}" -> "${novoStatus}" (${detalhe}).`
    );
  }

  return repository.atualizar(pedido.id, { status: novoStatus });
}

module.exports = { criar, listar, buscarPorId, atualizarStatus };
