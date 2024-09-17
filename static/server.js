const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let onlinePlayers = 0;
let messages = [];

// Função para enviar dados para todos os clientes conectados
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

wss.on('connection', (ws) => {
    onlinePlayers++;
    broadcast({ type: 'onlineCount', count: onlinePlayers });

    // Enviar mensagens anteriores para novos clientes
    ws.send(JSON.stringify({ type: 'initialMessages', messages }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'message' && data.content.length > 0 && data.content.length <= 100) {
                messages.push(data.content);
                if (messages.length > 100) {
                    messages.shift(); // Remove a mensagem mais antiga
                }
                broadcast({ type: 'message', content: data.content });
            }
        } catch (error) {
            console.error('Erro ao processar a mensagem:', error);
        }
    });

    ws.on('close', () => {
        onlinePlayers--;
        broadcast({ type: 'onlineCount', count: onlinePlayers });
    });
});

app.use(express.json());

app.get('/api/online', (req, res) => {
    res.json({ onlineCount: onlinePlayers });
});

app.post('/api/messages', (req, res) => {
    const { message } = req.body;
    if (message.length > 0 && message.length <= 100) {
        messages.push(message);
        if (messages.length > 100) {
            messages.shift(); // Remove a mensagem mais antiga
        }
        broadcast({ type: 'message', content: message });
        res.status(200).send();
    } else {
        res.status(400).send('Mensagem inválida');
    }
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Servidor WebSocket rodando na porta 3000');
});
