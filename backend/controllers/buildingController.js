const Building = require('../models/buildingModel');

exports.getAllBuildings = async (req, res) => {
  try {
    const buildings = await Building.getAll();
    res.json(buildings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBuildingById = async (req, res) => {
  try {
    const building = await Building.getById(req.params.id);
    if (!building) {
      return res.status(404).json({ error: 'Edificio no encontrado' });
    }
    res.json(building);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};