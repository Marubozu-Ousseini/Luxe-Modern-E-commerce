import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, isDbAvailable } from './db.js';
import type { Product } from '../../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const ordersFile = path.join(dataDir, 'orders.json');

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number; // snapshot price
}

export interface OrderRecord {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  currency: 'XAF';
  status: 'paid' | 'pending' | 'failed';
  createdAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(ordersFile)) fs.writeFileSync(ordersFile, '[]');
}

function readOrders(): OrderRecord[] {
  ensureDataDir();
  const raw = fs.readFileSync(ordersFile, 'utf-8');
  return JSON.parse(raw);
}

function writeOrders(orders: OrderRecord[]) {
  ensureDataDir();
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

export function createOrder(userId: string, products: Product[], cart: { productId: number; quantity: number }[]): OrderRecord {
  const items: OrderItem[] = cart.map(({ productId, quantity }) => {
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error(`Produit introuvable: ${productId}`);
    return { productId, quantity, price: product.price };
  });
  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const order: OrderRecord = {
    id: String(Date.now()),
    userId,
    items,
    total,
    currency: 'XAF',
    status: 'paid', // simulé
    createdAt: new Date().toISOString(),
  };
  const all = readOrders();
  all.push(order);
  writeOrders(all);
  return order;
}

export function getOrdersByUser(userId: string): OrderRecord[] {
  return readOrders().filter(o => o.userId === userId);
}

// Admin helpers
export function getAllOrders(): OrderRecord[] {
  return readOrders();
}

export function updateOrderStatus(id: string, status: OrderRecord['status']): OrderRecord | undefined {
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return undefined;
  orders[idx].status = status;
  writeOrders(orders);
  return orders[idx];
}

// === Async DB-backed variants ===
export async function createOrderAsync(userId: string, products: Product[], cart: { productId: number; quantity: number }[]): Promise<OrderRecord> {
  if (!isDbAvailable()) return createOrder(userId, products, cart);
  const items: OrderItem[] = cart.map(({ productId, quantity }) => {
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error(`Produit introuvable: ${productId}`);
    return { productId, quantity, price: product.price };
  });
  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const order: OrderRecord = {
    id: String(Date.now()),
    userId,
    items,
    total,
    currency: 'XAF',
    status: 'paid',
    createdAt: new Date().toISOString(),
  };
  await query('INSERT INTO orders (id, user_id, total, currency, status, created_at) VALUES ($1,$2,$3,$4,$5,$6)', [order.id, userId, total, order.currency, order.status, order.createdAt]);
  for (const it of items) {
    await query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)', [order.id, it.productId, it.quantity, it.price]);
  }
  return order;
}

export async function getOrdersByUserAsync(userId: string): Promise<OrderRecord[]> {
  if (!isDbAvailable()) return getOrdersByUser(userId);
  const { rows } = await query<any>('SELECT id, user_id as "userId", total, currency, status, created_at as "createdAt" FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
  return rows;
}

export async function getAllOrdersAsync(): Promise<OrderRecord[]> {
  if (!isDbAvailable()) return getAllOrders();
  const { rows } = await query<any>('SELECT id, user_id as "userId", total, currency, status, created_at as "createdAt" FROM orders ORDER BY created_at DESC');
  return rows;
}

export async function updateOrderStatusAsync(id: string, status: OrderRecord['status']): Promise<OrderRecord | undefined> {
  if (!isDbAvailable()) return updateOrderStatus(id, status);
  const { rows } = await query<any>('UPDATE orders SET status=$2 WHERE id=$1 RETURNING id, user_id as "userId", total, currency, status, created_at as "createdAt"', [id, status]);
  return rows[0];
}
