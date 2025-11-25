const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');

router.get('/', movementController.getAllMovements);
router.post('/', movementController.createMovement);
router.post('/assign', movementController.assignTool);
router.post('/transfer', movementController.transferTool);
router.post('/return', movementController.returnTool);

module.exports = router;