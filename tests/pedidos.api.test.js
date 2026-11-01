// Testes de integração: sobem o app Express em memória (sem abrir porta)
// e fazem requisições HTTP reais com supertest.

const request = require('supertest');
const app = require('../src/app');
const repository = require('../src/repositories/pedidosRepository');

const pedidoValido = {
  cliente: 'Carlos Silva',
  tipo: 'entrega',
  valor: 350,
  prioridade: 'normal',
};

beforeEach(() => {
  repository.limpar();
});

describe('POST /pedidos', () => {
  test('cria pedido válido e retorna 201 com status "recebido"', async () => {
    const res = await request(app).post('/pedidos').send(pedidoValido);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
  });

  test('remove espaços das extremidades do nome do cliente', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: '   Ana Souza  ' });

    expect(res.status).toBe(201);
    expect(res.body.cliente).toBe('Ana Souza');
  });

  test('ignora campos extras e não permite definir status/id na criação', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, id: 99, status: 'entregue', extra: 'x' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(res.body.status).toBe('recebido');
    expect(res.body).not.toHaveProperty('extra');
  });

  test.each([
    ['cliente ausente', { ...pedidoValido, cliente: undefined }, 'cliente'],
    ['cliente vazio', { ...pedidoValido, cliente: '' }, 'cliente'],
    ['cliente só com espaços', { ...pedidoValido, cliente: '    ' }, 'cliente'],
    ['cliente não texto', { ...pedidoValido, cliente: 123 }, 'cliente'],
    ['valor zero', { ...pedidoValido, valor: 0 }, 'valor'],
    ['valor negativo', { ...pedidoValido, valor: -10 }, 'valor'],
    ['valor como texto', { ...pedidoValido, valor: '350' }, 'valor'],
    ['valor ausente', { ...pedidoValido, valor: undefined }, 'valor'],
    ['tipo desconhecido', { ...pedidoValido, tipo: 'drone' }, 'tipo'],
    ['prioridade desconhecida', { ...pedidoValido, prioridade: 'maxima' }, 'prioridade'],
  ])('retorna 400 quando %s', async (_nome, corpo, campo) => {
    const res = await request(app).post('/pedidos').send(corpo);

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
    expect(res.body.detalhes.map((d) => d.campo)).toContain(campo);
  });

  test('retorna 400 listando todos os campos inválidos de uma vez', async () => {
    const res = await request(app).post('/pedidos').send({});

    expect(res.status).toBe(400);
    expect(res.body.detalhes.map((d) => d.campo)).toEqual([
      'cliente',
      'tipo',
      'valor',
      'prioridade',
    ]);
  });

  test('retorna 400 para JSON mal formado', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{"cliente": "Ana",}');

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/JSON inválido/);
  });

  test('retorna 413 quando o corpo JSON excede 10 KB', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, observacao: 'x'.repeat(11 * 1024) });

    expect(res.status).toBe(413);
    expect(res.body.erro).toMatch(/excede o limite de 10 KB/);
  });

  test('não cria pedido quando a requisição é inválida', async () => {
    await request(app).post('/pedidos').send({ ...pedidoValido, valor: -1 });
    const lista = await request(app).get('/pedidos');

    expect(lista.body).toHaveLength(0);
  });
});

describe('GET /pedidos', () => {
  test('retorna 200 e lista vazia quando não há pedidos', async () => {
    const res = await request(app).get('/pedidos');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('retorna 200 com todos os pedidos cadastrados, com ids sequenciais', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    await request(app).post('/pedidos').send({ ...pedidoValido, cliente: 'Maria', tipo: 'retirada' });

    const res = await request(app).get('/pedidos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((p) => p.id)).toEqual([1, 2]);
  });
});

describe('GET /pedidos/:id', () => {
  test('retorna 200 com o pedido existente', async () => {
    await request(app).post('/pedidos').send(pedidoValido);

    const res = await request(app).get('/pedidos/1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.cliente).toBe('Carlos Silva');
  });

  test.each(['999', 'abc', '0', '-1', '1.5'])('retorna 404 para id inexistente "%s"', async (id) => {
    const res = await request(app).get(`/pedidos/${id}`);

    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });
});

describe('PATCH /pedidos/:id/status', () => {
  beforeEach(async () => {
    await request(app).post('/pedidos').send(pedidoValido);
  });

  test('atualiza status válido e retorna 200', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'em_preparacao' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');

    const consulta = await request(app).get('/pedidos/1');
    expect(consulta.body.status).toBe('em_preparacao');
  });

  test('percorre o fluxo completo recebido -> em_preparacao -> enviado -> entregue', async () => {
    for (const status of ['em_preparacao', 'enviado', 'entregue']) {
      const res = await request(app).patch('/pedidos/1/status').send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  test('permite cancelar um pedido recebido', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'cancelado' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelado');
  });

  test('altera apenas o status (demais campos permanecem)', async () => {
    const res = await request(app)
      .patch('/pedidos/1/status')
      .send({ status: 'em_preparacao', valor: 1 });

    expect(res.body.valor).toBe(350);
  });

  test.each([
    ['status desconhecido', { status: 'perdido' }],
    ['status ausente', {}],
    ['status não texto', { status: 1 }],
  ])('retorna 400 quando %s', async (_nome, corpo) => {
    const res = await request(app).patch('/pedidos/1/status').send(corpo);

    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('retorna 400 para transição não permitida (recebido -> entregue)', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'entregue' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/Transição de status inválida/);
  });

  test('retorna 400 ao tentar repetir o status atual', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'recebido' });

    expect(res.status).toBe(400);
  });

  test('retorna 400 ao tentar alterar pedido cancelado (status final)', async () => {
    await request(app).patch('/pedidos/1/status').send({ status: 'cancelado' });
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'em_preparacao' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/final/);
  });

  test('retorna 400 ao cancelar pedido já enviado', async () => {
    await request(app).patch('/pedidos/1/status').send({ status: 'em_preparacao' });
    await request(app).patch('/pedidos/1/status').send({ status: 'enviado' });
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'cancelado' });

    expect(res.status).toBe(400);
  });

  test('retorna 404 para id inexistente', async () => {
    const res = await request(app).patch('/pedidos/999/status').send({ status: 'cancelado' });

    expect(res.status).toBe(404);
  });

  test('retorna 404 para id inexistente mesmo com corpo inválido', async () => {
    const res = await request(app).patch('/pedidos/999/status').send({ status: 'xyz' });

    expect(res.status).toBe(404);
  });
});

describe('Rotas e erros gerais', () => {
  test('GET /health confirma que a API está disponível', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('retorna 404 em JSON para rota inexistente', async () => {
    const res = await request(app).get('/produtos');

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/não encontrada/);
  });

  test('erro inesperado vira 500 sem expor detalhes internos', async () => {
    const spy = jest.spyOn(repository, 'listar').mockImplementation(() => {
      throw new Error('falha simulada no armazenamento');
    });
    const silenciaLog = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/pedidos');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ erro: 'Erro interno do servidor.' });

    spy.mockRestore();
    silenciaLog.mockRestore();
  });
});
