const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authenticate, authController.register); // protegido
router.get('/me', authenticate, authController.me);
router.post('/refresh', authController.refresh); // puede requerir userId
router.post('/logout', authController.logout);
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;
