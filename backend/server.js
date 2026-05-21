import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE = join(__dirname, 'orders.json');
const app = express();
const PORT = 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ── Tiny JSON "DB" ──────────────────────────────────────────────────────────
function readDB() {
  if (!existsSync(DB_FILE)) return { orders: [], nextId: 1 };
  return JSON.parse(readFileSync(DB_FILE, 'utf-8'));
}
function writeDB(data) {
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── Products (static) ───────────────────────────────────────────────────────
const PRODUCTS = {
  guava:  { id: 'guava',  name: 'Khagrachari Guava',   pricePerKg: 80,  emoji: '🍈' },
  mango:  { id: 'mango',  name: 'Hill Mango',           pricePerKg: 120, emoji: '🥭' },
  papaya: { id: 'papaya', name: 'Fresh Papaya',         pricePerKg: 50,  emoji: '🧡' },
  jujube: { id: 'jujube', name: 'Hill Jujube (Boroi)',  pricePerKg: 60,  emoji: '🍒' },
  lemon:  { id: 'lemon',  name: 'Hill Lemon',           pricePerKg: 70,  emoji: '🍋' },
};

app.get('/api/products', (_req, res) => res.json(Object.values(PRODUCTS)));

app.post('/api/orders', (req, res) => {
  const { customer, items, totalAmount, paymentMethod } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });

  const db = readDB();
  const order = {
    id: db.nextId++,
    createdAt: new Date().toISOString(),
    status: 'pending',
    customer,
    items,
    totalAmount,
    paymentMethod,
  };
  db.orders.push(order);
  writeDB(db);

  res.json({ success: true, orderId: `KA-${String(order.id).padStart(5, '0')}` });
});

app.get('/api/orders/:id', (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

app.listen(PORT, () =>
  console.log(`🌿 KhagraChori Agro API → http://localhost:${PORT}`)
);
