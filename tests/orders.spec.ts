import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src-server/app.js';

const rnd = () => Math.random().toString(36).slice(2);

async function registerAndLogin() {
  const email = `user_${rnd()}@example.com`;
  const password = 'Password123!';
  const registerRes = await request(app).post('/api/auth/register').send({ name: 'Order User', email, password });
  expect(registerRes.status).toBe(201);
  // Registration sets cookie already
  const cookie = registerRes.headers['set-cookie'][0];
  return { email, cookie };
}

describe('Order creation', () => {
  it('creates an order with items', async () => {
    const { cookie } = await registerAndLogin();
    // Fetch products
    const productsRes = await request(app).get('/api/produits');
    expect(productsRes.status).toBe(200);
    const products = productsRes.body;
    expect(products.length).toBeGreaterThan(0);
    const first = products[0];
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Cookie', cookie)
      .send({ items: [{ productId: first.id, quantity: 2 }] });
  expect(orderRes.status).toBe(201);
    expect(orderRes.body.total).toBeGreaterThan(0);
  });
});
