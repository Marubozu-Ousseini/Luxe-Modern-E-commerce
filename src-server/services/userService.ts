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

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');
}

function readUsers(): UserRecord[] {
  ensureDataDir();
  const raw = fs.readFileSync(usersFile, 'utf-8');
  return JSON.parse(raw);
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
