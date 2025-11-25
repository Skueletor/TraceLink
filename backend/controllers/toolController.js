const Tool = require('../models/toolModel');

exports.getAllTools = async (req, res) => {
  try {
    const tools = await Tool.getAll();
    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getToolById = async (req, res) => {
  try {
    const tool = await Tool.getById(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }
    res.json(tool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTool = async (req, res) => {
  try {
    const { name, code, category, maxTime, max_time } = req.body;
    
    // Validaciones
    if (!name || !code || !category || !(maxTime || max_time)) {
      return res.status(400).json({ 
        error: 'Todos los campos son obligatorios: name, code, category, max_time' 
      });
    }

    // Normalizar el campo max_time
    const normalizedMaxTime = maxTime || max_time;
    
    // Verificar si el código ya existe
    const pool = require('../config/database');
    const existingTool = await pool.query('SELECT id FROM tools WHERE code = $1', [code]);
    if (existingTool.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe una herramienta con este código' });
    }
    
    // Crear la herramienta
    const tool = await Tool.create(name, code, category, normalizedMaxTime);
    console.log('Herramienta creada:', tool);
    
    // Buscar el almacén dinámicamente
    const almacenResult = await pool.query(
      "SELECT id FROM buildings WHERE description ILIKE '%almac%' OR name ILIKE '%almac%' LIMIT 1"
    );
    const almacenId = almacenResult.rows[0]?.id || 3; // fallback a 3
    
    // Asignar automáticamente al almacén
    await pool.query(
      'INSERT INTO tool_assignments (tool_id, building_id, is_active) VALUES ($1, $2, $3)',
      [tool.id, almacenId, true]
    );
    
    console.log(`Herramienta ${tool.name} asignada al almacén (ID: ${almacenId})`);
    res.status(201).json(tool);
  } catch (error) {
    console.error('Error creando herramienta:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTool = async (req, res) => {
  try {
    const { name, code, category, maxTime, max_time } = req.body;
    
    // Validaciones
    if (!name || !code || !category || !(maxTime || max_time)) {
      return res.status(400).json({ 
        error: 'Todos los campos son obligatorios: name, code, category, max_time' 
      });
    }

    // Normalizar el campo max_time (aceptar ambos formatos)
    const normalizedMaxTime = maxTime || max_time;
    
    console.log('Actualizando herramienta:', { name, code, category, max_time: normalizedMaxTime });
    
    const tool = await Tool.update(req.params.id, name, code, category, normalizedMaxTime);
    if (!tool) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }
    
    console.log('Herramienta actualizada:', tool);
    res.json(tool);
  } catch (error) {
    console.error('Error actualizando herramienta:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTool = async (req, res) => {
  try {
    await Tool.delete(req.params.id);
    res.json({ message: 'Herramienta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};