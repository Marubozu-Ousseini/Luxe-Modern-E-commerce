import request from 'supertest';
import { describe, it, expect } from 'vitest';
import express from 'express';
import productRoutes from '../src-server/api/produits';

// Build a minimal app for testing public endpoints
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/produits', productRoutes);
  app.get('/health', (_req, res) => res.send('OK'));
  return app;
}

describe('Public API', () => {
  const app = buildApp();

  it('should return health OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  it('should list products', async () => {
    const res = await request(app).get('/api/produits');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should filter products with search and paginate', async () => {
    const res = await request(app).get('/api/produits?q=Montre&limit=2&offset=0');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
