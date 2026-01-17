import { describe, it, expect } from 'vitest';
import request from 'supertest';
// Ensure test environment uses in-memory services
process.env.NODE_ENV = 'test';
import { app } from '../src-server/app.js';
import { createUser } from '../src-server/services/userService.js';

describe('Admin login flow', () => {
  it('logs in as admin and accesses admin endpoints', async () => {
    const email = `admin_login_${Date.now()}@example.com`;
    const password = 'Password123!';
    // Create an admin user directly in in-memory store
    createUser('Administrator', email, password, 'admin');

    // Login via API
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers['set-cookie']?.[0];
    expect(cookie).toBeTruthy();

    // Access an admin-protected route using the auth cookie
    const res = await request(app)
      .get('/api/admin/produits')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const dashRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', cookie);
    expect(dashRes.status).toBe(200);
    expect(dashRes.body).toHaveProperty('orders');
    expect(dashRes.body).toHaveProperty('products');
  });
});
