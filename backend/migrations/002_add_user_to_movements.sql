-- Añadir columna user_id a la tabla movements para rastrear quién realizó cada movimiento
ALTER TABLE movements ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_movements_user_id ON movements(user_id);

COMMENT ON COLUMN movements.user_id IS 'Usuario que realizó el movimiento';