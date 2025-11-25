const express = require('express');
const router = express.Router();
const toolController = require('../controllers/toolController');

router.get('/', toolController.getAllTools);
router.get('/:id', toolController.getToolById);
router.post('/', toolController.createTool);
router.put('/:id', toolController.updateTool);
router.delete('/:id', toolController.deleteTool);

module.exports = router;