-- Migración 003: Implementar lógica de una herramienta por trabajador
-- Esta migración añade restricciones para asegurar que un trabajador solo pueda
-- tener una herramienta activa a la vez

BEGIN;

-- Opción 1: Restricción a nivel de base de datos (más estricta)
-- Crear un índice único parcial que evite múltiples asignaciones activas por trabajador
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_tool_per_worker 
ON tool_assignments (worker_id) 
WHERE is_active = true AND worker_id IS NOT NULL;

-- Opción 2: Añadir una función de validación (alternativa)
-- Función para verificar si un trabajador ya tiene una herramienta activa
CREATE OR REPLACE FUNCTION check_worker_has_active_tool(p_worker_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tool_assignments 
        WHERE worker_id = p_worker_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener la herramienta activa de un trabajador
CREATE OR REPLACE FUNCTION get_worker_active_tool(p_worker_id INTEGER)
RETURNS TABLE(tool_id INTEGER, tool_name VARCHAR, building_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT ta.tool_id, t.name, b.name
    FROM tool_assignments ta
    JOIN tools t ON ta.tool_id = t.id
    JOIN buildings b ON ta.building_id = b.id
    WHERE ta.worker_id = p_worker_id 
    AND ta.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Comentarios sobre el enfoque
COMMENT ON INDEX idx_one_active_tool_per_worker IS 'Asegura que un trabajador solo pueda tener una herramienta activa a la vez';
COMMENT ON FUNCTION check_worker_has_active_tool IS 'Verifica si un trabajador ya tiene una herramienta asignada';
COMMENT ON FUNCTION get_worker_active_tool IS 'Obtiene la información de la herramienta activa de un trabajador';

COMMIT;