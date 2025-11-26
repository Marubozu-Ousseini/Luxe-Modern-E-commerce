// Helper to update the users.json inside the container
const fs = require('fs');
const bcrypt = require('bcryptjs');
const p = '/tmp/luxe-data/users.json';
const pass = process.argv[2];
if (!pass) { console.error('password arg required'); process.exit(2); }
const email = 'admin@malafaareh.com';
let users = [];
if (fs.existsSync(p)) {
  try { users = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { users = []; }
}
let u = users.find(x => x.email === email);
if (!u) { u = { id: String(Date.now()), email, name: 'Administrator', role: 'admin' }; users.push(u); }
u.passwordHash = bcrypt.hashSync(pass, 10);
u.role = 'admin';
fs.writeFileSync(p, JSON.stringify(users, null, 2));
console.log('ok updated', email);
