-- Migración 006: Corregir todos los tipos de datos para compatibilidad completa

BEGIN;

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS get_active_loans_with_time_info();
DROP FUNCTION IF EXISTS generate_loan_alerts();

-- Recrear función con tipos TEXT en lugar de VARCHAR
CREATE OR REPLACE FUNCTION get_active_loans_with_time_info()
RETURNS TABLE(
    assignment_id INTEGER,
    tool_id INTEGER,
    tool_name TEXT,
    tool_code TEXT,
    worker_id INTEGER,
    worker_name TEXT,
    worker_code TEXT,
    building_name TEXT,
    assigned_at TIMESTAMP,
    max_time_str TEXT,
    max_time_minutes INTEGER,
    time_elapsed_minutes NUMERIC,
    time_remaining_minutes NUMERIC,
    is_overdue BOOLEAN,
    overdue_minutes NUMERIC,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ta.id::INTEGER as assignment_id,
        t.id::INTEGER as tool_id,
        t.name::TEXT as tool_name,
        t.code::TEXT as tool_code,
        w.id::INTEGER as worker_id,
        w.name::TEXT as worker_name,
        w.code::TEXT as worker_code,
        b.name::TEXT as building_name,
        ta.assigned_at::TIMESTAMP,
        t.max_time::TEXT as max_time_str,
        parse_max_time_to_minutes(t.max_time)::INTEGER as max_time_minutes,
        (EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60)::NUMERIC as time_elapsed_minutes,
        (parse_max_time_to_minutes(t.max_time) - EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60)::NUMERIC as time_remaining_minutes,
        (EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60 > parse_max_time_to_minutes(t.max_time))::BOOLEAN as is_overdue,
        GREATEST(0, EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60 - parse_max_time_to_minutes(t.max_time))::NUMERIC as overdue_minutes,
        (CASE 
            WHEN EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60 > parse_max_time_to_minutes(t.max_time) THEN 'overdue'
            WHEN EXTRACT(EPOCH FROM (NOW() - ta.assigned_at))/60 > parse_max_time_to_minutes(t.max_time) * 0.8 THEN 'warning'
            ELSE 'active'
        END)::TEXT as status
    FROM tool_assignments ta
    JOIN tools t ON ta.tool_id = t.id
    JOIN workers w ON ta.worker_id = w.id
    JOIN buildings b ON ta.building_id = b.id
    WHERE ta.is_active = true 
    AND ta.worker_id IS NOT NULL
    ORDER BY ta.assigned_at;
END;
$$ LANGUAGE plpgsql;

-- Recrear función de generación de alertas
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

COMMIT;