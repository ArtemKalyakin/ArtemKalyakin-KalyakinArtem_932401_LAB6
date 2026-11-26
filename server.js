const express = require('express');
const path = require('path');

const app = express();
const PORT = 4000; // Поменяли порт на 4000, чтобы избежать конфликтов
const ROOT = __dirname;

const ALLOWED_OPS = ['+', '-', '*', '/'];
const BLOCKED = ['server.js', 'package.json', 'package-lock.json'];

function parseNumber(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function calcAndRespond(a, b, op, res) {
  if (a === undefined || b === undefined || op === undefined) {
    return res.status(400).json({
      result: null,
      expression: null,
      error: 'Необходимо передать параметры a, b и op'
    });
  }

  const numA = parseNumber(a);
  const numB = parseNumber(b);
  if (numA === null || numB === null) {
    return res.status(400).json({
      result: null,
      expression: null,
      error: 'Параметры a и b должны быть числами'
    });
  }

  if (typeof op !== 'string' || !ALLOWED_OPS.includes(op)) {
    return res.status(400).json({
      result: null,
      expression: null,
      error: `Недопустимая операция "${op}". Разрешены: ${ALLOWED_OPS.join(' ')}`
    });
  }

  if (op === '/' && numB === 0) {
    return res.status(400).json({
      result: null,
      expression: `${numA}/${numB}`,
      error: 'Деление на ноль невозможно'
    });
  }

  let result;
  switch (op) {
    case '+': result = numA + numB; break;
    case '-': result = numA - numB; break;
    case '*': result = numA * numB; break;
    case '/': result = numA / numB; break;
  }

  const clean = Number(result.toPrecision(12));
  res.json({ result: clean, expression: `${numA}${op}${numB}`, error: null });
}

/* ---------- API ---------- */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/calc', (req, res) => {
  const { a, b, op } = req.query;
  calcAndRespond(a, b, op, res);
});

app.get('/api/calc/:op/:a/:b', (req, res) => {
  const { op, a, b } = req.params;
  calcAndRespond(a, b, op, res);
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API-маршрут не найден' });
});

/* ---------- Страницы ---------- */
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(ROOT, 'about.html'));
});

/* ---------- Статика ---------- */
app.use((req, res, next) => {
  const name = path.basename(req.path);
  if (BLOCKED.includes(name) || req.path.startsWith('/node_modules')) {
    return res.status(404).send('Not found');
  }
  next();
});
app.use(express.static(ROOT, { extensions: ['html'] }));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Сервер запущен: http://127.0.0.1:${PORT}`);
});