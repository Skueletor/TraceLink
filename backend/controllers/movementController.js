const Movement = require('../models/movementModel');

exports.getAllMovements = async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const movements = await Movement.getAll(limit);
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMovement = async (req, res) => {
  try {
    const body = req.body || {};
    const toolId = body.toolId ?? body.tool_id;
    const workerId = body.workerId ?? body.worker_id ?? null;
    const fromBuildingId = body.fromBuildingId ?? body.from_building_id ?? null;
    const toBuildingId = body.toBuildingId ?? body.to_building_id;
    const movementType = body.movementType ?? body.movement_type;
    const description = body.description ?? body.action_description ?? null;

    if (!toolId || !toBuildingId || !movementType) {
      return res.status(400).json({
        error: 'Parámetros inválidos: toolId/tool_id, toBuildingId/to_building_id y movementType/movement_type son requeridos'
      });
    }

    // Incluir el ID del usuario autenticado
    const userId = req.user?.id || null;
    const movement = await Movement.create(toolId, workerId, fromBuildingId, toBuildingId, movementType, description, userId);
    res.status(201).json(movement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignTool = async (req, res) => {
  try {
    const { toolId, workerId, buildingId } = req.body;
    await Movement.assignTool(toolId, workerId, buildingId);
    res.json({ message: 'Herramienta asignada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.transferTool = async (req, res) => {
  try {
    const { toolId, buildingId } = req.body;
    if (!toolId || !buildingId) {
      return res.status(400).json({ error: 'Parámetros inválidos: toolId y buildingId son requeridos' });
    }
    await Movement.transferTool(toolId, buildingId);
    res.json({ message: 'Herramienta transferida exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.returnTool = async (req, res) => {
  try {
    const { toolId } = req.body;
    await Movement.returnTool(toolId);
    res.json({ message: 'Herramienta devuelta exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWorkerActiveTool = async (req, res) => {
  try {
    const { workerId } = req.params;
    const activeTool = await Movement.getWorkerActiveTool(workerId);
    res.json({ activeTool });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkWorkerHasActiveTool = async (req, res) => {
  try {
    const { workerId } = req.params;
    const hasActiveTool = await Movement.checkWorkerHasActiveTool(workerId);
    res.json({ hasActiveTool });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};