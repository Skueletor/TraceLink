-- Migración 005: Parche para corregir tipos de datos en función de monitoreo

BEGIN;

-- Eliminar la función existente primero
DROP FUNCTION IF EXISTS get_active_loans_with_time_info();

-- Recrear la función con los tipos correctos
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

COMMIT;