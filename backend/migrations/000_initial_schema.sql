-- Initial schema migration - TraceLink Core Tables
-- Esta migración contiene las tablas principales del sistema de rastreo de herramientas
-- Debe ejecutarse antes que las migraciones de autenticación (001_auth.sql)

BEGIN;

-- ====================================
-- TABLAS PRINCIPALES DEL SISTEMA
-- ====================================

-- Tabla de edificios/ubicaciones
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(100),
    color VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de trabajadores
CREATE TABLE IF NOT EXISTS workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    area VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de herramientas
CREATE TABLE IF NOT EXISTS tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    max_time VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignaciones de herramientas (ubicación y trabajador)
CREATE TABLE IF NOT EXISTS tool_assignments (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    building_id INTEGER REFERENCES buildings(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    returned_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true
);

-- Tabla de movimientos/historial
CREATE TABLE IF NOT EXISTS movements (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES tools(id),
    worker_id INTEGER REFERENCES workers(id),
    from_building_id INTEGER REFERENCES buildings(id),
    to_building_id INTEGER REFERENCES buildings(id),
    movement_type VARCHAR(20) NOT NULL,
    action_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ====================================

-- Índices para tool_assignments
CREATE INDEX IF NOT EXISTS idx_tool_assignments_tool_id ON tool_assignments(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_assignments_worker_id ON tool_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_tool_assignments_building_id ON tool_assignments(building_id);
CREATE INDEX IF NOT EXISTS idx_tool_assignments_active ON tool_assignments(is_active);

-- Índices para movements
CREATE INDEX IF NOT EXISTS idx_movements_tool_id ON movements(tool_id);
CREATE INDEX IF NOT EXISTS idx_movements_worker_id ON movements(worker_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON movements(created_at DESC);

-- Índices únicos para códigos
CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_code_unique ON workers(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tools_code_unique ON tools(code);

-- ====================================
-- DATOS INICIALES (SEED DATA)
-- ====================================

-- Insertar edificios base
INSERT INTO buildings (name, description, color) VALUES
('Edificio A', 'Producción', 'bg-blue-500'),
('Edificio B', 'Mantenimiento', 'bg-green-500'),
('Edificio C', 'Almacén', 'bg-purple-500'),
('Edificio D', 'Administración', 'bg-orange-500')
ON CONFLICT DO NOTHING;

-- Insertar trabajadores de ejemplo
INSERT INTO workers (name, code, role, area) VALUES
('Juan Pérez', 'EMP-001', 'Técnico', 'Producción'),
('María González', 'EMP-002', 'Supervisor', 'Mantenimiento'),
('Carlos Rodríguez', 'EMP-003', 'Operario', 'Producción'),
('Ana Martínez', 'EMP-004', 'Técnico', 'Mantenimiento'),
('Luis Torres', 'EMP-005', 'Almacenista', 'Almacén')
ON CONFLICT (code) DO NOTHING;

-- Insertar herramientas de ejemplo
INSERT INTO tools (name, code, category, max_time) VALUES
('Taladro Industrial', 'TL-001', 'Perforación', '4 horas'),
('Sierra Circular', 'SC-002', 'Corte', '6 horas'),
('Llave Inglesa', 'LI-003', 'Ajuste', '2 horas'),
('Multímetro Digital', 'MD-004', 'Medición', '8 horas'),
('Soldadora MIG', 'SM-005', 'Soldadura', '6 horas'),
('Martillo Neumático', 'MN-006', 'Construcción', '4 horas'),
('Nivel Láser', 'NL-007', 'Medición', '8 horas'),
('Amoladora Angular', 'AA-008', 'Corte', '4 horas')
ON CONFLICT (code) DO NOTHING;

-- Asignar todas las herramientas al almacén inicialmente (Edificio C = id 3)
INSERT INTO tool_assignments (tool_id, building_id, is_active)
SELECT t.id, 3, true
FROM tools t
WHERE NOT EXISTS (
  SELECT 1 FROM tool_assignments ta 
  WHERE ta.tool_id = t.id AND ta.is_active = true
);

-- ====================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================

COMMENT ON TABLE buildings IS 'Ubicaciones/edificios donde pueden estar las herramientas';
COMMENT ON TABLE workers IS 'Empleados que pueden usar las herramientas';
COMMENT ON TABLE tools IS 'Inventario de herramientas del sistema';
COMMENT ON TABLE tool_assignments IS 'Asignaciones actuales de herramientas (ubicación y trabajador)';
COMMENT ON TABLE movements IS 'Historial de todos los movimientos de herramientas';

COMMENT ON COLUMN tool_assignments.is_active IS 'Solo una asignación activa por herramienta';
COMMENT ON COLUMN tools.max_time IS 'Tiempo máximo permitido de préstamo';
COMMENT ON COLUMN tools.status IS 'Estado: available, in_use, maintenance, damaged';
COMMENT ON COLUMN movements.movement_type IS 'Tipo: assign, return, transfer, maintenance';

COMMIT;

-- ====================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ====================================

-- Consulta para verificar que todas las herramientas estén correctamente asignadas
-- SELECT t.id, t.name, t.code, b.name as building_name, ta.is_active
-- FROM tools t
-- LEFT JOIN tool_assignments ta ON t.id = ta.tool_id AND ta.is_active = true
-- LEFT JOIN buildings b ON ta.building_id = b.id
-- ORDER BY t.id;