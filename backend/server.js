const http = require('http');

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

  if (req.method === 'GET' && url === '/todos') {
    return send(res, 200, todos);
  }

  if (req.method === 'POST' && url === '/todos') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { text } = JSON.parse(body);
      const todo = { id: nextId++, text, done: false };
      todos.push(todo);
      send(res, 201, todo);
    });
    return;
  }

  const toggleMatch = url.match(/^\/todos\/(\d+)\/toggle$/);
  if (req.method === 'PATCH' && toggleMatch) {
    const todo = todos.find(t => t.id === parseInt(toggleMatch[1]));
    if (!todo) return send(res, 404, { error: 'Not found' });
    todo.done = !todo.done;
    return send(res, 200, todo);
  }

  const deleteMatch = url.match(/^\/todos\/(\d+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    todos = todos.filter(t => t.id !== parseInt(deleteMatch[1]));
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
