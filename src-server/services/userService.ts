import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

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
  return readUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): UserRecord | undefined {
  return readUsers().find(u => u.id === id);
}

export function createUser(name: string, email: string, password: string, role: Role = 'user'): UserRecord {
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
  const users = readUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return undefined;
  users[idx].role = role;
  writeUsers(users);
  return users[idx];
}

export function setUserPassword(email: string, newPassword: string): UserRecord | undefined {
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
