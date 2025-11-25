const Worker = require('../models/workerModel');

exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.getAll();
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.getById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createWorker = async (req, res) => {
  try {
    const { name, code, role, area } = req.body;
    const worker = await Worker.create(name, code, role, area);
    res.status(201).json(worker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const { name, code, role, area } = req.body;
    const worker = await Worker.update(req.params.id, name, code, role, area);
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    await Worker.delete(req.params.id);
    res.json({ message: 'Trabajador eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};