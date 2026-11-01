// Erros "esperados" da aplicação. Carregam o status HTTP que devem gerar.
// Qualquer erro que NÃO seja AppError é tratado como inesperado (HTTP 500).

class AppError extends Error {
  constructor(mensagem, statusCode, detalhes) {
    super(mensagem);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.detalhes = detalhes;
  }
}

class ValidationError extends AppError {
  constructor(mensagem, detalhes) {
    super(mensagem, 400, detalhes);
  }
}

class NotFoundError extends AppError {
  constructor(mensagem) {
    super(mensagem, 404);
  }
}

module.exports = { AppError, ValidationError, NotFoundError };
