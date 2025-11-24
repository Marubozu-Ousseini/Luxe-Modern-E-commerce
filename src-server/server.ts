import 'dotenv/config';
import app from './app.js';
import { initDb, isDbAvailable } from './services/db.js';
import { createUserAsync, findUserByEmailAsync } from './services/userService.js';
import { logger } from './config/logger.js';

const PORT = process.env.PORT || 8080;

// === Démarrage du Serveur ===
async function seedAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@malafaareh.com';
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin seed');
      return;
    }
    if (isDbAvailable()) {
      const existing = await findUserByEmailAsync(email);
      if (!existing) {
        await createUserAsync('Administrator', email, password, 'admin');
        logger.info(`(DB) Admin user created for ${email}`);
      } else if (existing.role !== 'admin') {
        logger.warn(`(DB) User ${email} exists but is not admin. Update role manually.`);
      } else {
        logger.info('(DB) Admin user already present');
      }
    } else {
      const { findUserByEmail, createUser } = await import('./services/userService.js');
      const existing = findUserByEmail(email);
      if (!existing) {
        createUser('Administrator', email, password, 'admin');
        logger.info(`(FS) Admin user created for ${email}`);
      } else if (existing.role !== 'admin') {
        logger.warn(`(FS) User ${email} exists but is not admin. Delete user in data/users.json to recreate as admin.`);
      } else {
        logger.info('(FS) Admin user already present');
      }
    }
  } catch (e) {
    logger.error('Admin seed failed', e);
  }
}

app.listen(PORT, async () => {
  logger.info(`Le serveur est lancé sur le port ${PORT}`);
  logger.info(`Environnement: ${process.env.NODE_ENV}`);
  await initDb();
  await seedAdmin();
});