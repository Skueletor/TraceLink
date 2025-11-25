-- Migración 004: Sistema de monitoreo de préstamos con alertas automáticas
-- Esta migración añade funcionalidad para rastrear tiempo de préstamo y generar alertas

BEGIN;

-- ====================================
-- TABLA DE ALERTAS DE PRÉSTAMOS VENCIDOS
-- ====================================

CREATE TABLE IF NOT EXISTS loan_alerts (
    id SERIAL PRIMARY KEY,
    tool_assignment_id INTEGER REFERENCES tool_assignments(id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL DEFAULT 'overdue', -- 'warning', 'overdue', 'critical'
    message TEXT NOT NULL,
    time_overdue INTERVAL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- FUNCIONES PARA CÁLCULO DE TIEMPO
-- ====================================

-- Función para convertir max_time texto a minutos
CREATE OR REPLACE FUNCTION parse_max_time_to_minutes(max_time_str VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    result INTEGER;
BEGIN
    -- Extraer número y convertir según unidad
    IF max_time_str ILIKE '%hora%' THEN
        result := CAST(REGEXP_REPLACE(max_time_str, '[^0-9]', '', 'g') AS INTEGER) * 60;
    ELSIF max_time_str ILIKE '%minuto%' OR max_time_str ILIKE '%min%' THEN
        result := CAST(REGEXP_REPLACE(max_time_str, '[^0-9]', '', 'g') AS INTEGER);
    ELSIF max_time_str ILIKE '%día%' OR max_time_str ILIKE '%day%' THEN
        result := CAST(REGEXP_REPLACE(max_time_str, '[^0-9]', '', 'g') AS INTEGER) * 1440; -- 24*60
    ELSE
        -- Default: asumir horas si no se especifica
        result := CAST(REGEXP_REPLACE(max_time_str, '[^0-9]', '', 'g') AS INTEGER) * 60;
    END IF;
    
    RETURN COALESCE(result, 480); -- Default 8 horas = 480 minutos
END;
$$ LANGUAGE plpgsql;

-- Función para obtener préstamos activos con información de tiempo
CREATE OR REPLACE FUNCTION get_active_loans_with_time_info()
RETURNS TABLE(
    assignment_id INTEGER,
    tool_id INTEGER,
    tool_name VARCHAR,
    tool_code VARCHAR,
    worker_id INTEGER,
    worker_name VARCHAR,
    worker_code VARCHAR,
    building_name VARCHAR,
    assigned_at TIMESTAMP,
    max_time_str VARCHAR,
    max_time_minutes INTEGER,
    time_elapsed_minutes NUMERIC,
    time_remaining_minutes NUMERIC,
    is_overdue BOOLEAN,
    overdue_minutes NUMERIC,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ta.id as assignment_id,
        t.id as tool_id,
        t.name as tool_name,
        t.code as tool_code,
        w.id as worker_id,
        w.name as worker_name,
        w.code as worker_code,
        b.name as building_name,
        ta.assigned_at,
        t.max_time as max_time_str,
        parse_max_time_to_minutes(t.max_time) as max_time_minutes,
        EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60 as time_elapsed_minutes,
        (parse_max_time_to_minutes(t.max_time) - EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60) as time_remaining_minutes,
        (EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60 > parse_max_time_to_minutes(t.max_time)) as is_overdue,
        GREATEST(0, EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60 - parse_max_time_to_minutes(t.max_time)) as overdue_minutes,
        CASE 
            WHEN EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60 > parse_max_time_to_minutes(t.max_time) THEN 'overdue'
            WHEN EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60 > parse_max_time_to_minutes(t.max_time) * 0.8 THEN 'warning'
            ELSE 'active'
        END as status
    FROM tool_assignments ta
    JOIN tools t ON ta.tool_id = t.id
    JOIN workers w ON ta.worker_id = w.id
    JOIN buildings b ON ta.building_id = b.id
    WHERE ta.is_active = true 
    AND ta.worker_id IS NOT NULL
    ORDER BY ta.assigned_at;
END;
$$ LANGUAGE plpgsql;

-- Función para generar alertas automáticamente
CREATE OR REPLACE FUNCTION generate_loan_alerts()
RETURNS INTEGER AS $$
DECLARE
    loan_record RECORD;
    alert_message TEXT;
    existing_alert INTEGER;
    alerts_created INTEGER := 0;
BEGIN
    -- Procesar cada préstamo activo
    FOR loan_record IN SELECT * FROM get_active_loans_with_time_info() WHERE is_overdue = true LOOP
        
        -- Verificar si ya existe una alerta activa para este préstamo
        SELECT id INTO existing_alert 
        FROM loan_alerts 
        WHERE tool_assignment_id = loan_record.assignment_id 
        AND is_resolved = false;
        
        -- Si no existe alerta, crearla
        IF existing_alert IS NULL THEN
            alert_message := FORMAT(
                'El trabajador %s (%s) no ha devuelto la herramienta "%s" (%s). Tiempo excedido: %s minutos.',
                loan_record.worker_name,
                loan_record.worker_code,
                loan_record.tool_name,
                loan_record.tool_code,
                ROUND(loan_record.overdue_minutes)
            );
            
            INSERT INTO loan_alerts (
                tool_assignment_id,
                worker_id,
                tool_id,
                alert_type,
                message,
                time_overdue
            ) VALUES (
                loan_record.assignment_id,
                loan_record.worker_id,
                loan_record.tool_id,
                CASE 
                    WHEN loan_record.overdue_minutes > 120 THEN 'critical'
                    ELSE 'overdue'
                END,
                alert_message,
                (loan_record.overdue_minutes || ' minutes')::INTERVAL
            );
            
            alerts_created := alerts_created + 1;
        ELSE
            -- Actualizar alerta existente con nuevo tiempo
            alert_message := FORMAT(
                'El trabajador %s (%s) no ha devuelto la herramienta "%s" (%s). Tiempo excedido: %s minutos.',
                loan_record.worker_name,
                loan_record.worker_code,
                loan_record.tool_name,
                loan_record.tool_code,
                ROUND(loan_record.overdue_minutes)
            );
            
            UPDATE loan_alerts SET
                message = alert_message,
                time_overdue = (loan_record.overdue_minutes || ' minutes')::INTERVAL,
                updated_at = NOW(),
                alert_type = CASE 
                    WHEN loan_record.overdue_minutes > 120 THEN 'critical'
                    ELSE 'overdue'
                END
            WHERE id = existing_alert;
        END IF;
    END LOOP;
    
    RETURN alerts_created;
END;
$$ LANGUAGE plpgsql;

-- Función para resolver alertas cuando se devuelve herramienta
CREATE OR REPLACE FUNCTION resolve_loan_alerts_for_assignment(p_assignment_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    resolved_count INTEGER;
BEGIN
    UPDATE loan_alerts SET
        is_resolved = true,
        resolved_at = NOW()
    WHERE tool_assignment_id = p_assignment_id
    AND is_resolved = false;
    
    GET DIAGNOSTICS resolved_count = ROW_COUNT;
    RETURN resolved_count;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ====================================

CREATE INDEX IF NOT EXISTS idx_loan_alerts_assignment_id ON loan_alerts(tool_assignment_id);
CREATE INDEX IF NOT EXISTS idx_loan_alerts_worker_id ON loan_alerts(worker_id);
CREATE INDEX IF NOT EXISTS idx_loan_alerts_resolved ON loan_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_loan_alerts_created_at ON loan_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_assignments_active_worker ON tool_assignments(is_active, worker_id, assigned_at);

-- ====================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================

COMMENT ON TABLE loan_alerts IS 'Alertas automáticas para préstamos vencidos de herramientas';
COMMENT ON FUNCTION parse_max_time_to_minutes IS 'Convierte formato de texto max_time a minutos para cálculos';
COMMENT ON FUNCTION get_active_loans_with_time_info IS 'Obtiene información completa de tiempo para todos los préstamos activos';
COMMENT ON FUNCTION generate_loan_alerts IS 'Genera/actualiza alertas automáticamente para préstamos vencidos';
COMMENT ON FUNCTION resolve_loan_alerts_for_assignment IS 'Resuelve alertas cuando se devuelve una herramienta';

COMMIT;