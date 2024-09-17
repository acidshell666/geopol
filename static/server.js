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

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'message') {
            if (data.content.length > 0 && data.content.length <= 100) {
                messages.push(data.content);
                if (messages.length > 100) { // Limitar o número de mensagens
                    messages.shift(); // Remove a mensagem mais antiga
                }
                broadcast({ type: 'message', content: data.content });
            }
        }
    });

    ws.on('close', () => {
        onlinePlayers--;
        broadcast({ type: 'onlineCount', count: onlinePlayers });
    });
});

app.use(express.json());

// Rota para obter a contagem de jogadores online
app.get('/api/online', (req, res) => {
    res.json({ onlineCount: onlinePlayers });
});

// Rota para obter mensagens
app.get('/api/messages', (req, res) => {
    res.json({ messages });
});

// Rota para enviar mensagens
app.post('/api/messages', (req, res) => {
    const { message } = req.body;
    if (message.length > 0 && message.length <= 100) {
        messages.push(message);
        if (messages.length > 100) { // Limitar o número de mensagens
            messages.shift(); // Remove a mensagem mais antiga
        }
        broadcast({ type: 'message', content: message });
        res.status(200).send();
    } else {
        res.status(400).send('Mensagem inválida');
    }
});

// Substitua pelo IP público ou domínio do servidor
server.listen(3000, '0.0.0.0', () => {
    console.log('Servidor WebSocket rodando na porta 3000');
});
