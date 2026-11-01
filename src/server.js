const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`API de Pedidos rodando em http://localhost:${PORT}`);
});

function encerrarServidor(sinal) {
  console.log(`${sinal} recebido. Encerrando servidor...`);
  server.close((erro) => {
    if (erro) {
      console.error('Erro ao encerrar o servidor:', erro);
      process.exitCode = 1;
      return;
    }

    console.log('Servidor encerrado com sucesso.');
  });
}

process.once('SIGINT', () => encerrarServidor('SIGINT'));
process.once('SIGTERM', () => encerrarServidor('SIGTERM'));
