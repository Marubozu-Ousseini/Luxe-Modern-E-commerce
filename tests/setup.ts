import fs from 'fs';
import os from 'os';
import path from 'path';

// Ensure a stable test mode across all test files.
process.env.NODE_ENV = 'test';

// Prevent parallel test files from clobbering the same filesystem-backed JSON stores
// (e.g., data/users.json). Each Vitest worker process gets its own DATA_DIR.
if (!process.env.DATA_DIR) {
  const base = path.join(os.tmpdir(), 'luxe-modern-ecommerce-tests');
  fs.mkdirSync(base, { recursive: true });
  const unique = fs.mkdtempSync(path.join(base, `worker-${process.pid}-`));
  process.env.DATA_DIR = unique;
}
