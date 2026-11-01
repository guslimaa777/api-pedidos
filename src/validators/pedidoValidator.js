// Validação dos dados de entrada. Só verifica formato/valores aceitos;
// regras que dependem do estado do pedido (transições) ficam no service.

const { TIPOS, PRIORIDADES, STATUS } = require('../config/regras');
const { ValidationError } = require('../errors/AppError');

function ehObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function validarCriacao(body) {
  if (!ehObjeto(body)) {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON.');
  }

  const erros = [];
  const { cliente, tipo, valor, prioridade } = body;

  if (typeof cliente !== 'string' || cliente.trim() === '') {
    erros.push({ campo: 'cliente', mensagem: 'cliente é obrigatório e deve ser um texto não vazio.' });
  }

  if (!TIPOS.includes(tipo)) {
    erros.push({ campo: 'tipo', mensagem: `tipo deve ser um dos valores: ${TIPOS.join(', ')}.` });
  }

  // typeof garante número de verdade (a string "350" é rejeitada);
  // Number.isFinite descarta NaN e Infinity.
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    erros.push({ campo: 'valor', mensagem: 'valor deve ser numérico e maior que zero.' });
  }

  if (!PRIORIDADES.includes(prioridade)) {
    erros.push({
      campo: 'prioridade',
      mensagem: `prioridade deve ser um dos valores: ${PRIORIDADES.join(', ')}.`,
    });
  }

  if (erros.length > 0) {
    throw new ValidationError('Dados do pedido inválidos.', erros);
  }

  // Devolve apenas os campos aceitos, já normalizados (campos extras são ignorados).
  return { cliente: cliente.trim(), tipo, valor, prioridade };
}

function validarStatus(body) {
  if (!ehObjeto(body)) {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON.');
  }

  const { status } = body;

  if (!STATUS.includes(status)) {
    throw new ValidationError('Status inválido.', [
      { campo: 'status', mensagem: `status deve ser um dos valores: ${STATUS.join(', ')}.` },
    ]);
  }

  return status;
}

function validarFiltrosListagem(query) {
  const filtros = {};
  const erros = [];
  const opcoes = [
    ['status', STATUS],
    ['tipo', TIPOS],
    ['prioridade', PRIORIDADES],
  ];

  for (const [campo, valores] of opcoes) {
    const valor = query[campo];
    if (valor === undefined) continue;

    if (!valores.includes(valor)) {
      erros.push({
        campo,
        mensagem: `${campo} deve ser um dos valores: ${valores.join(', ')}.`,
      });
      continue;
    }

    filtros[campo] = valor;
  }

  if (erros.length > 0) {
    throw new ValidationError('Filtros de listagem inválidos.', erros);
  }

  return filtros;
}

module.exports = { validarCriacao, validarStatus, validarFiltrosListagem };
