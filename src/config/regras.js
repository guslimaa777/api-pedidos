// Valores reconhecidos pela API. Centralizados aqui para que validação,
// regras de negócio e documentação usem a mesma fonte.

const TIPOS = ['entrega', 'retirada'];

const PRIORIDADES = ['baixa', 'normal', 'alta'];

const STATUS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];

const STATUS_INICIAL = 'recebido';

// Para cada status atual, quais status podem vir em seguida.
// "entregue" e "cancelado" são finais: não aceitam nenhuma transição.
const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: [],
};

module.exports = { TIPOS, PRIORIDADES, STATUS, STATUS_INICIAL, TRANSICOES };
