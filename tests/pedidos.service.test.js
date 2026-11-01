// Testes unitários da camada de serviço: chamam as funções diretamente,
// sem HTTP. Mostram que as regras de negócio não dependem do Express.

const service = require('../src/services/pedidosService');
const repository = require('../src/repositories/pedidosRepository');
const { ValidationError, NotFoundError } = require('../src/errors/AppError');

const dados = { cliente: 'Carlos Silva', tipo: 'retirada', valor: 10.5, prioridade: 'alta' };

beforeEach(() => repository.limpar());

describe('pedidosService', () => {
  test('criar define id e status inicial "recebido"', () => {
    const pedido = service.criar(dados);

    expect(pedido).toEqual({ id: 1, ...dados, status: 'recebido' });
  });

  test('criar aceita valor decimal', () => {
    expect(service.criar({ ...dados, valor: 0.01 }).valor).toBe(0.01);
  });

  test('criar lança ValidationError para dados inválidos', () => {
    expect(() => service.criar({ ...dados, valor: NaN })).toThrow(ValidationError);
    expect(() => service.criar(null)).toThrow(ValidationError);
    expect(() => service.criar([])).toThrow(ValidationError);
  });

  test('buscarPorId lança NotFoundError para id inexistente', () => {
    expect(() => service.buscarPorId('1')).toThrow(NotFoundError);
  });

  test('atualizarStatus lança NotFoundError antes de validar o corpo', () => {
    expect(() => service.atualizarStatus('5', { status: 'invalido' })).toThrow(NotFoundError);
  });

  test('atualizarStatus bloqueia saída de status final', () => {
    service.criar(dados);
    service.atualizarStatus('1', { status: 'em_preparacao' });
    service.atualizarStatus('1', { status: 'enviado' });
    service.atualizarStatus('1', { status: 'entregue' });

    expect(() => service.atualizarStatus('1', { status: 'cancelado' })).toThrow(/final/);
  });

  test('listar devolve cópias (alterar o retorno não altera o armazenamento)', () => {
    service.criar(dados);
    const lista = service.listar();
    lista[0].status = 'entregue';

    expect(service.buscarPorId('1').status).toBe('recebido');
  });
});
