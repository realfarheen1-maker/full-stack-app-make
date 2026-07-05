const http = require('http');
const SplunkLogger = require('splunk-logging').Logger;

// --- Splunk setup ---
// To use Splunk: set these env variables on Render:
//   SPLUNK_TOKEN = your HEC token
//   SPLUNK_URL   = your Splunk HEC endpoint (e.g. https://your-instance.splunkcloud.com:8088)
const splunkConfig = {
  token: process.env.SPLUNK_TOKEN || 'YOUR_SPLUNK_HEC_TOKEN',
  url: process.env.SPLUNK_URL || 'https://your-instance.splunkcloud.com:8088'
};
const splunk = new SplunkLogger(splunkConfig);

function log(level, message, data = {}) {
  const entry = { level, message, ...data, time: new Date().toISOString() };
  console.log(JSON.stringify(entry));
  if (process.env.SPLUNK_TOKEN) {
    splunk.send({ message: entry }, (err) => {
      if (err) console.error('Splunk error:', err.message);
    });
  }
}
// --------------------

let todos = [];
let nextId = 1;

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});

  const url = req.url;
  if (url !== '/health' && url !== '/') {
    log('info', 'incoming request', { method: req.method, url });
  }

  if (req.method === 'GET' && url === '/todos') {
    log('info', 'fetched todos', { count: todos.length });
    return send(res, 200, todos);
  }

  if (req.method === 'POST' && url === '/todos') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { text } = JSON.parse(body);
      const todo = { id: nextId++, text, done: false };
      todos.push(todo);
      log('info', 'todo created', { todo });
      send(res, 201, todo);
    });
    return;
  }

  const toggleMatch = url.match(/^\/todos\/(\d+)\/toggle$/);
  if (req.method === 'PATCH' && toggleMatch) {
    const todo = todos.find(t => t.id === parseInt(toggleMatch[1]));
    if (!todo) {
      log('warn', 'todo not found for toggle', { id: toggleMatch[1] });
      return send(res, 404, { error: 'Not found' });
    }
    todo.done = !todo.done;
    log('info', 'todo toggled', { todo });
    return send(res, 200, todo);
  }

  const deleteMatch = url.match(/^\/todos\/(\d+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    todos = todos.filter(t => t.id !== parseInt(deleteMatch[1]));
    log('info', 'todo deleted', { id: deleteMatch[1] });
    return send(res, 200, { ok: true });
  }

  log('warn', 'route not found', { method: req.method, url });
  if (req.method === 'POST' && url === '/log') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      log('info', data.message || 'frontend log', { source: 'frontend', ...data });
      send(res, 200, { ok: true });
    });
    return;
  }

  send(res, 404, { error: 'Not found' });
});

if (!process.env.TEST_PORT) {
  server.listen(3000, () => {
    log('info', 'Server started', { port: 3000 });
  });
}

module.exports = server;
