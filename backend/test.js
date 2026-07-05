const assert = require('assert');
const http = require('http');

const BASE = 'http://localhost:3001';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('Running tests...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  await test('GET /todos returns empty array initially', async () => {
    const res = await request('GET', '/todos');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, []);
  });

  await test('POST /todos creates a new todo', async () => {
    const res = await request('POST', '/todos', { text: 'buy milk' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.text, 'buy milk');
    assert.strictEqual(res.body.done, false);
    assert.ok(res.body.id);
  });

  await test('GET /todos returns the created todo', async () => {
    const res = await request('GET', '/todos');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].text, 'buy milk');
  });

  await test('PATCH /todos/:id/toggle toggles todo to done', async () => {
    const res = await request('PATCH', '/todos/1/toggle');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.done, true);
  });

  await test('PATCH /todos/:id/toggle toggles todo back to undone', async () => {
    const res = await request('PATCH', '/todos/1/toggle');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.done, false);
  });

  await test('DELETE /todos/:id removes the todo', async () => {
    await request('DELETE', '/todos/1');
    const res = await request('GET', '/todos');
    assert.strictEqual(res.body.length, 0);
  });

  await test('GET unknown route returns 404', async () => {
    const res = await request('GET', '/unknown');
    assert.strictEqual(res.status, 404);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

// Start server on port 3001 for testing
process.env.TEST_PORT = '3001';
const server = require('./server');
server.listen(3001, async () => {
  try {
    await runTests();
  } finally {
    server.close();
  }
});
