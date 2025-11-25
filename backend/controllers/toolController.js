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
    const { name, code, category, maxTime } = req.body;
    
    // Crear la herramienta
    const tool = await Tool.create(name, code, category, maxTime);
    
    // Asignar automáticamente al almacén (Edificio C - id: 3)
    const pool = require('../config/database');
    await pool.query(
      'INSERT INTO tool_assignments (tool_id, building_id, is_active) VALUES ($1, $2, $3)',
      [tool.id, 3, true]
    );
    
    res.status(201).json(tool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTool = async (req, res) => {
  try {
    const { name, code, category, maxTime } = req.body;
    const tool = await Tool.update(req.params.id, name, code, category, maxTime);
    res.json(tool);
  } catch (error) {
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