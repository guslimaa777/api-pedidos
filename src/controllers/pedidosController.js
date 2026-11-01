// Camada HTTP: lê a requisição, chama o service e define o status da resposta.
// Erros são repassados com next(erro) para o middleware de tratamento central.

const pedidosService = require('../services/pedidosService');

function criar(req, res, next) {
  try {
    const pedido = pedidosService.criar(req.body);
    res.status(201).json(pedido);
  } catch (erro) {
    next(erro);
  }
}

function listar(req, res, next) {
  try {
    res.status(200).json(pedidosService.listar());
  } catch (erro) {
    next(erro);
  }
}

function buscarPorId(req, res, next) {
  try {
    res.status(200).json(pedidosService.buscarPorId(req.params.id));
  } catch (erro) {
    next(erro);
  }
}

function atualizarStatus(req, res, next) {
  try {
    const pedido = pedidosService.atualizarStatus(req.params.id, req.body);
    res.status(200).json(pedido);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { criar, listar, buscarPorId, atualizarStatus };
