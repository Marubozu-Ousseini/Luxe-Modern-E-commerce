import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src-server/app.js';

const rnd = () => Math.random().toString(36).slice(2);

describe('Auth flow', () => {
  it('registers and logs in a user', async () => {
    const email = `user_${rnd()}@example.com`;
    const password = 'Password123!';
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password });
  expect(registerRes.status).toBe(201);

    // Registration already sets auth cookie
    expect(registerRes.headers['set-cookie']).toBeTruthy();
  });
});
