const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let onlinePlayers = 0;
let messages = [];

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'static')));

// Servir o home.html que está na raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'home.html'));
});

// API para obter a contagem de jogadores online
app.get('/api/online', (req, res) => {
    res.json({ onlineCount: onlinePlayers });
});

// API para obter as mensagens
app.get('/api/messages', (req, res) => {
    res.json({ messages });
});

// API para enviar mensagens
app.post('/api/messages', express.json(), (req, res) => {
    const { message } = req.body;
    messages.push(message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ message }));
        }
    });
    res.status(201).json({ message: 'Message sent' });
});

// Gerenciar conexões WebSocket
wss.on('connection', (ws) => {
    onlinePlayers++;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'onlineCount', count: onlinePlayers }));
        }
    });

    ws.on('close', () => {
        onlinePlayers--;
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'onlineCount', count: onlinePlayers }));
            }
        });
    });
});

// Iniciar o servidor
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
