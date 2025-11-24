import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { query, isDbAvailable } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const usersFile = path.join(dataDir, 'users.json');

type Role = 'user' | 'admin';

export interface Voucher {
  code: string;
  amount?: number; // optional monetary value in minor units (e.g., XAF)
  expiresAt?: string; // ISO date string
  createdAt: string; // ISO date string
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  rewardsPoints?: number;
  vouchers?: Voucher[];
  favorites?: number[]; // product IDs favored by user (FS persistence)
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');
}

function readUsers(): UserRecord[] {
  ensureDataDir();
  const raw = fs.readFileSync(usersFile, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    // Attempt to sanitize common corruption: trailing characters after closing bracket
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      const slice = raw.slice(start, end + 1);
      try {
        const parsed = JSON.parse(slice);
        // Heal the file on disk
        fs.writeFileSync(usersFile, JSON.stringify(parsed, null, 2));
        return parsed;
      } catch {/* fallthrough */}
    }
    // As a last resort, reset file to empty array to avoid crashing the app
    fs.writeFileSync(usersFile, '[]');
    return [];
  }
}

function writeUsers(users: UserRecord[]) {
  ensureDataDir();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): UserRecord | undefined {
  if (isDbAvailable()) {
    // Synchronous variant not supported with DB; advise using async below
    throw new Error('Use findUserByEmailAsync when DB is enabled');
  }
  return readUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): UserRecord | undefined {
  if (isDbAvailable()) throw new Error('Use findUserByIdAsync when DB is enabled');
  return readUsers().find(u => u.id === id);
}

export function createUser(name: string, email: string, password: string, role: Role = 'user'): UserRecord {
  if (isDbAvailable()) throw new Error('Use createUserAsync when DB is enabled');
  const users = readUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email déjà utilisé');
  }
  const id = String(Date.now());
  const passwordHash = bcrypt.hashSync(password, 10);
  const user: UserRecord = { id, email, name, role, passwordHash };
  users.push(user);
  writeUsers(users);
  return user;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  return bcrypt.compareSync(password, passwordHash);
}

export function createUserIfNotExists(name: string, email: string, password: string, role: Role = 'user'): UserRecord {
  const existing = findUserByEmail(email);
  if (existing) return existing;
  return createUser(name, email, password, role);
}

export function setUserRole(email: string, role: Role): UserRecord | undefined {
  if (isDbAvailable()) throw new Error('Use setUserRoleAsync when DB is enabled');
  const users = readUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return undefined;
  users[idx].role = role;
  writeUsers(users);
  return users[idx];
}

export function setUserPassword(email: string, newPassword: string): UserRecord | undefined {
  if (isDbAvailable()) throw new Error('Use setUserPasswordAsync when DB is enabled');
  const users = readUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return undefined;
  users[idx].passwordHash = bcrypt.hashSync(newPassword, 10);
  writeUsers(users);
  return users[idx];
}

// Rewards & Vouchers (FS-only for now)
export function grantRewardsPoints(email: string, delta: number): UserRecord | undefined {
  if (isDbAvailable()) throw new Error('Use grantRewardsPointsAsync when DB is enabled');
  const users = readUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return undefined;
  const current = users[idx].rewardsPoints || 0;
  users[idx].rewardsPoints = Math.max(0, current + delta);
  writeUsers(users);
  return users[idx];
}

export function addVoucherToUser(email: string, voucher: Omit<Voucher, 'createdAt'>): UserRecord | undefined {
  if (isDbAvailable()) throw new Error('Use addVoucherToUserAsync when DB is enabled');
  const users = readUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return undefined;
  const list = users[idx].vouchers || [];
  const newVoucher: Voucher = { ...voucher, createdAt: new Date().toISOString() };
  users[idx].vouchers = [newVoucher, ...list];
  writeUsers(users);
  return users[idx];
}

// === Favorites (FS only; DB path would require separate table) ===
export function getUserFavoritesById(id: string): number[] {
  if (isDbAvailable()) throw new Error('Favorites not implemented for DB mode');
  const users = readUsers();
  const u = users.find(u => u.id === id);
  return u?.favorites || [];
}

export function toggleUserFavoriteById(id: string, productId: number): number[] {
  if (isDbAvailable()) throw new Error('Favorites not implemented for DB mode');
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Utilisateur introuvable');
  const favs = users[idx].favorites || [];
  users[idx].favorites = favs.includes(productId)
    ? favs.filter(f => f !== productId)
    : [...favs, productId];
  writeUsers(users);
  return users[idx].favorites;
}

// Admin helpers (sanitize before returning)
export function getAllUsersSanitized(): Omit<UserRecord, 'passwordHash'>[] {
  return readUsers().map(({ passwordHash, ...rest }) => rest);
}

// === Async DB-backed variants ===
export async function findUserByEmailAsync(email: string): Promise<UserRecord | undefined> {
  if (!isDbAvailable()) return findUserByEmail(email);
  const { rows } = await query<UserRecord>('SELECT id, email, name, role, password_hash as "passwordHash" FROM users WHERE lower(email)=lower($1) LIMIT 1', [email]);
  return rows[0];
}

export async function findUserByIdAsync(id: string): Promise<UserRecord | undefined> {
  if (!isDbAvailable()) return findUserById(id);
  const { rows } = await query<UserRecord>('SELECT id, email, name, role, password_hash as "passwordHash" FROM users WHERE id=$1 LIMIT 1', [id]);
  return rows[0];
}

export async function createUserAsync(name: string, email: string, password: string, role: Role = 'user'): Promise<UserRecord> {
  if (!isDbAvailable()) return createUser(name, email, password, role);
  const existing = await findUserByEmailAsync(email);
  if (existing) throw new Error('Email déjà utilisé');
  const id = String(Date.now());
  const passwordHash = bcrypt.hashSync(password, 10);
  await query('INSERT INTO users (id, email, name, role, password_hash) VALUES ($1,$2,$3,$4,$5)', [id, email, name, role, passwordHash]);
  return { id, email, name, role, passwordHash };
}

export async function createUserIfNotExistsAsync(name: string, email: string, password: string, role: Role = 'user'): Promise<UserRecord> {
  const existing = await findUserByEmailAsync(email);
  if (existing) return existing;
  return createUserAsync(name, email, password, role);
}

export async function setUserRoleAsync(email: string, role: Role): Promise<UserRecord | undefined> {
  if (!isDbAvailable()) return setUserRole(email, role);
  const { rows } = await query<UserRecord>('UPDATE users SET role=$2 WHERE lower(email)=lower($1) RETURNING id, email, name, role, password_hash as "passwordHash"', [email, role]);
  return rows[0];
}

export async function setUserPasswordAsync(email: string, newPassword: string): Promise<UserRecord | undefined> {
  if (!isDbAvailable()) return setUserPassword(email, newPassword);
  const hash = bcrypt.hashSync(newPassword, 10);
  const { rows } = await query<UserRecord>('UPDATE users SET password_hash=$2 WHERE lower(email)=lower($1) RETURNING id, email, name, role, password_hash as "passwordHash"', [email, hash]);
  return rows[0];
}

export async function getAllUsersSanitizedAsync(): Promise<Omit<UserRecord, 'passwordHash'>[]> {
  if (!isDbAvailable()) return getAllUsersSanitized();
  const { rows } = await query<UserRecord>('SELECT id, email, name, role, password_hash as "passwordHash" FROM users ORDER BY created_at DESC');
  return rows.map(({ passwordHash, ...rest }) => rest);
}
