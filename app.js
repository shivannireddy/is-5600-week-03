const express = require('express');
const path = require('path');
const EventEmitter = require('events');

const port = process.env.PORT || 3000;
const chatEmitter = new EventEmitter();

function respondText(req, res) {
  res.end('hi');
}

function respondJson(req, res) {
  res.json({
    text: 'hi',
    numbers: [1, 2, 3],
  });
}

function respondNotFound(req, res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

function respondEcho(req, res) {
  const { input = '' } = req.query;

  res.json({
    normal: input,
    // cspell:ignore shouty
    shouty: input.toUpperCase(),
    charCount: input.length,
    backwards: input.split('').reverse().join(''),
  });
}

function chatApp(req, res) {
  res.sendFile(path.join(__dirname, '/chat.html'));
}

function respondChat(req, res) {
  const { message } = req.query;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  chatEmitter.emit('message', message);
  res.status(200).json({ success: true, message });
}

function respondSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
  });

  const onMessage = (message) => res.write(`data: ${message}\n\n`);
  chatEmitter.on('message', onMessage);

  // Keep the connection alive
  const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 30000);

  res.on('close', () => {
    clearInterval(keepAlive);
    chatEmitter.off('message', onMessage);
  });
}

const app = express();

// Log each incoming request (for debugging and visibility)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.static(__dirname + '/public'));

app.get('/', chatApp);
app.get('/chat', respondChat);
app.get('/sse', respondSSE);

// Additional basic routes for lab completeness
app.get('/text', respondText);
app.get('/json', respondJson);
app.get('/echo', respondEcho);

// Health check route
app.get('/status', (req, res) => {
  res.send('✅ NodeJS Chat API is running properly');
});

// Catch-all for unknown routes
app.use(respondNotFound);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

