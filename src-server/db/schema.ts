import { pgTable, text, varchar, integer, boolean, timestamp, numeric } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 32 }).notNull().default('user'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: integer('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  price: integer('price').notNull(), // amount in smallest currency unit (e.g. XAF no decimals)
  originalPrice: integer('original_price'),
  description: text('description').notNull(),
  category: varchar('category', { length: 128 }).notNull(),
  imageUrl: text('image_url').notNull(),
  stock: integer('stock').default(0).notNull(),
  limitedAvailability: boolean('limited_availability').default(false).notNull(),
  ratingRate: numeric('rating_rate'),
  ratingCount: integer('rating_count'),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  total: integer('total').notNull(),
  currency: varchar('currency', { length: 8 }).notNull().default('XAF'),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: integer('id').primaryKey().notNull(),
  orderId: text('order_id').notNull(),
  productId: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
});
