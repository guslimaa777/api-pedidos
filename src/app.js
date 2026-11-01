const express = require('express');
const pedidosRoutes = require('./routes/pedidosRoutes');
const { rotaNaoEncontrada, tratadorDeErros } = require('./middlewares/errorHandler');

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  res.status(200).json({ mensagem: 'API de Gerenciamento de Pedidos', rotas: '/pedidos' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/pedidos', pedidosRoutes);

// Precisam ficar depois das rotas: primeiro o 404 de rota, depois o tratador geral.
app.use(rotaNaoEncontrada);
app.use(tratadorDeErros);

module.exports = app;
