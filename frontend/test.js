const assert = require('assert');
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('./index.html', 'utf8');
const { document } = new JSDOM(html).window;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

console.log('Running frontend tests...\n');

test('h2 says "Todo List App"', () => {
  const h2 = document.querySelector('h2');
  assert.ok(h2, 'h2 element not found');
  assert.strictEqual(h2.textContent, 'Todo List App');
});

test('input field exists', () => {
  const input = document.querySelector('input#input');
  assert.ok(input, 'input#input not found');
});

test('Add button exists', () => {
  const btn = document.querySelector('button');
  assert.ok(btn, 'button not found');
  assert.strictEqual(btn.textContent, 'Add');
});

test('todo list ul exists', () => {
  const ul = document.querySelector('ul#list');
  assert.ok(ul, 'ul#list not found');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
