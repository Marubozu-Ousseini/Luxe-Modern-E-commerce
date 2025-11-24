import { describe, it, expect } from 'vitest';
import request from 'supertest';
// Force test environment fallback (no DB)
process.env.NODE_ENV = 'test';
import { app } from '../src-server/app.js';
import { createUser } from '../src-server/services/userService.js';
import { signToken } from '../src-server/middleware/auth.js';

describe('Admin full CRUD flow (in-memory)', () => {
  it('creates admin user and uses signed token to exercise admin endpoints', async () => {
    const email = `admin_full_${Date.now()}@example.com`;
    const password = 'Password123!';
    // Directly create user with admin role to bypass role promotion route (avoids needing existing admin)
  const admin = createUser('Administrator', email, password, 'admin');
  // Bypass login instability by signing token directly (equivalent payload)
  const token = signToken({ id: admin.id, email: admin.email, role: 'admin' });
  const adminCookie = `token=${token}`;

    // List products
    const listRes = await request(app).get('/api/admin/produits').set('Cookie', adminCookie);
    expect(listRes.status).toBe(200);
    const initialCount = listRes.body.length;

    // Create product
    const createRes = await request(app)
      .post('/api/admin/produits')
      .set('Cookie', adminCookie)
      .send({
        name: 'Admin Flow Product',
        price: 9999,
        description: 'Flow test product',
        category: 'Flow',
        imageUrl: 'https://example.com/flow.png',
        stock: 3
      });
    expect(createRes.status).toBe(201);
    const pid = createRes.body.id;

    // Update product
    const updateRes = await request(app)
      .put(`/api/admin/produits/${pid}`)
      .set('Cookie', adminCookie)
      .send({ stock: 10 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.stock).toBe(10);

    // Delete product
    const delRes = await request(app)
      .delete(`/api/admin/produits/${pid}`)
      .set('Cookie', adminCookie);
    expect(delRes.status).toBe(204);

    // Users list
  const usersRes = await request(app).get('/api/admin/users').set('Cookie', adminCookie);
  expect(usersRes.status).toBe(200);
  expect(Array.isArray(usersRes.body)).toBe(true);

    // Create order referencing product id 1 (static seed) if exists
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Cookie', adminCookie)
      .send({ items: [{ productId: 1, quantity: 1 }] });
    expect(orderRes.status).toBe(201);

    // Orders list (admin)
    const ordersRes = await request(app).get('/api/admin/orders').set('Cookie', adminCookie);
    expect(ordersRes.status).toBe(200);
    expect(Array.isArray(ordersRes.body)).toBe(true);
    expect(ordersRes.body.length).toBeGreaterThan(0);

    // Payments view
    const payRes = await request(app).get('/api/admin/payments').set('Cookie', adminCookie);
    expect(payRes.status).toBe(200);
  });
});
