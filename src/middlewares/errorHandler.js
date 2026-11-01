const { AppError } = require('../errors/AppError');

// Qualquer rota não declarada cai aqui.
function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}

// Middleware de erro do Express (precisa ter os 4 parâmetros).
// eslint-disable-next-line no-unused-vars
function tratadorDeErros(erro, req, res, next) {
  // Erros previstos pela aplicação (400, 404).
  if (erro instanceof AppError) {
    const corpo = { erro: erro.message };
    if (erro.detalhes) corpo.detalhes = erro.detalhes;
    return res.status(erro.statusCode).json(corpo);
  }

  // JSON mal formado no corpo (ex.: vírgula sobrando). O express.json()
  // lança esse erro antes de chegar ao controller; é culpa do cliente -> 400.
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  // Qualquer outra coisa é falha nossa: registra no log e responde 500
  // sem expor detalhes internos (stack trace) ao cliente.
  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { rotaNaoEncontrada, tratadorDeErros };
