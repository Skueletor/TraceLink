-- Auth schema migration
BEGIN;

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) UNIQUE NOT NULL,
  description VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  worker_id INTEGER REFERENCES workers(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(200) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed roles
INSERT INTO roles (name, description) VALUES ('admin','Administrador del sistema'), ('user','Usuario estándar') ON CONFLICT (name) DO NOTHING;

-- Admin user seed
-- pass: Admin123!
INSERT INTO users (name, email, password_hash, role_id)
SELECT 'Administrador', 'admin@tracelink.local', '$2b$10$rwmBkD69uyhf3BFBsgE3meLoaRdo/2z./HpQLLGEikGMXzS/rztnq', r.id FROM roles r WHERE r.name='admin'
ON CONFLICT (email) DO NOTHING;

COMMIT;