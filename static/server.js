const WebSocket = require('ws');
const http = require('http');
const express = require('express');

// Criação do servidor HTTP e WebSocket
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let onlineCount = 0;
const messages = []; // Armazena as mensagens do chat

// Middleware para servir arquivos estáticos
app.use(express.static('public')); // Certifique-se de que seu HTML e outros arquivos estão na pasta 'public'

// Função para broadcast de mensagens para todos os clientes conectados
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Gerenciamento de conexões WebSocket
wss.on('connection', (ws) => {
    onlineCount++;
    // Enviar contagem de jogadores online para todos os clientes
    broadcast({ type: 'onlineCount', count: onlineCount });

    // Enviar mensagens anteriores para o novo cliente
    ws.send(JSON.stringify({ type: 'initialMessages', messages }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'message') {
            // Armazenar a nova mensagem e transmitir para todos os clientes
            if (data.content.length <= 100) { // Limitar a 100 caracteres
                messages.push(data.content);
                broadcast({ type: 'message', content: data.content });
            }
        }
    });

    ws.on('close', () => {
        onlineCount--;
        // Enviar a nova contagem de jogadores online para todos os clientes
        broadcast({ type: 'onlineCount', count: onlineCount });
    });
});

// Inicia o servidor na porta 3000
server.listen(3000, () => {
    console.log('Servidor WebSocket rodando na porta 3000');
});
