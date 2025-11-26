-- Migration: create users table (if missing) and import existing filesystem users
BEGIN;

-- Create table if not exists (simple schema matching app expectations)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  password_hash TEXT NOT NULL,
  rewards_points INTEGER DEFAULT 0,
  vouchers JSONB DEFAULT '[]'::jsonb,
  favorites INTEGER[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Insert or update existing users from filesystem store
-- Note: password_hash values are bcrypt hashes and are inserted directly

INSERT INTO users (id,email,name,role,password_hash,created_at) VALUES
('1763342715021','admin@malafaareh.com','Administrator','admin','$2a$10$W9msCv/oJgdQTqB/RLp3lOUGYEQ4ZqmH3jnbBVKVPMF3wh.P4JDWS',now()),
('1763342756305','user_l3f9tvjzkbo@example.com','X','user','$2a$10$eGMMblvCFoy0Gk73Ih3ejObqDH6axgBA.VJuinriIzCQOFFVumAHK',now()),
('1763342847782','user_jfxyt20hmy@example.com','Order User','user','$2a$10$pBmkszFQrO.rp6xOUclpR.JConZ.xZsiQA4n1GUvmw9/LTo6GuqLy',now()),
('1764003407541','user_mgswu7t7dtk@example.com','X','user','$2a$10$QRbs8aZWAOEywXK/UFbZ5e/6okZWG2570fRAj6Rb2cC4vN1l5MvsK',now()),
('1764003467120','user_z7p9tw2rt9@example.com','X','user','$2a$10$WCmjJwQCTRNRCmR/sjQp4up..RcRp529XziJlNFlbBmC12SXX..JG',now()),
('1764008863408','user_ced8e6r0hqg@example.com','X','user','$2a$10$qujE4jkUQLD3s.8Gp0BqOOdXCdrOFa.UhrGM2bqJm0fkcyzdWPzNG',now()),
('1764008863630','user_cxz6hara7v@example.com','Test User','user','$2a$10$j8pgmjhSDMOJih/VhZjgLOebjH0Hv/18i61eJC7VwDXcJRqiGrM8.',now()),
('1764008885816','user_9i3w4rsyi08@example.com','Order User','user','$2a$10$wOUMbzURdpmOqjjsb.8OZeyrvX3qm/OzSUXSaLhplRbFJdBIyRgba',now()),
('1764013120982','user_g42x2viquk4@example.com','Test User','user','$2a$10$N8lxNY9qsPslk6tJYkUw4OAOWmKiOEnEBlrerS.qtUcpPibODUXwq',now()),
('1764013229138','user_xlikxmtseqb@example.com','Test User','user','$2a$10$wsG8QvNHnTo6CmMwpZCKSuv6Mj3lAck7GC5YMfZxyRUuofq1kVFJe',now()),
('1764015480356','admin_full_1764015480355@example.com','Administrator','admin','$2a$10$v/N9eFqRCer8L.uCTQs/seOcjnSbY2r7Fckh4uo5rByCpNsZwoQey',now()),
('1764119391025','user_v7f99kkzb0r@example.com','X','user','$2a$10$m7o7JyWRetkY.8Si6SuCv.he.A9FoW4XGZ1JTdDgCwCpXiKyJgOYe',now()),
('1764119391355','user_sujyh24mpsq@example.com','Test User','user','$2a$10$6NIoqszDK0TGOAeO7PClju6ouLo8b3JsDt2J4f34VawqjtLEqS6F.',now()),
('1764119568770','user_grplu4qslz5@example.com','X','user','$2a$10$nBtwDqH4ZSTzUieiCnN2nOZATs./Q/OyYtd3e2w55Imten4bkx4pW',now())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash;

COMMIT;
