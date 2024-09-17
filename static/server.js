const express = require('express');
const bodyParser = require('body-parser');
const Pusher = require('pusher');

const app = express();
const port = 3000;

// Configuração do Pusher
const pusher = new Pusher({
  appId: '1865978',
  key: 'f7affd0d3f9b219756e7',
  secret: '3207954ee416a0f1e3df',
  cluster: 'us2',
  useTLS: true
});

app.use(bodyParser.json());

// Endpoint para enviar mensagens
app.post('/api/send-message', (req, res) => {
  const { message } = req.body;

  if (message && message.length <= 100) { // Limite de 100 caracteres
    pusher.trigger('chat', 'message', { message });
    res.sendStatus(200);
  } else {
    res.status(400).send('Message exceeds character limit');
  }
});

// Servir arquivos estáticos da raiz
app.use(express.static(__dirname));

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
