import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src-server/app.js';

const rnd = () => Math.random().toString(36).slice(2);

async function registerAndLogin(role: 'user' | 'admin' = 'user') {
  const email = `${role}_${rnd()}@example.com`;
  const password = 'Password123!';
  const registerRes = await request(app).post('/api/auth/register').send({ name: 'X', email, password });
  expect(registerRes.status).toBe(201);
  if (role === 'admin') {
    await request(app).patch('/api/admin/users/role').send({ email, role: 'admin' });
  }
  // Registration sets cookie
  const cookie = registerRes.headers['set-cookie'][0];
  return { email, cookie };
}

describe('Admin guards', () => {
  it('denies access for non-admin user', async () => {
    const { cookie } = await registerAndLogin('user');
    const res = await request(app).get('/api/admin/produits').set('Cookie', cookie);
    expect(res.status).toBe(403);
  });
});
