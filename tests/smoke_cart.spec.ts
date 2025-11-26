import request from 'supertest';
import { describe, it, expect } from 'vitest';
import express from 'express';
import cartRoutes from '../src-server/api/cart';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/cart', cartRoutes);
  app.get('/health', (_req, res) => res.send('OK'));
  return app;
}

describe('Smoke: cart endpoints', () => {
  const app = buildApp();

  it('responds to health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  it('returns empty cart when unauthenticated', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('requires auth for merge', async () => {
    const res = await request(app)
      .post('/api/cart/merge')
      .send({ cart: [{ productId: 1, qty: 2 }] });
    expect(res.status).toBe(401);
  });
});
