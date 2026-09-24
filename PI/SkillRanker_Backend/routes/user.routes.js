const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');
const userController = require('../controllers/user.controller');

// Only HR & Managers can see users
router.get('/', authenticate, authorize('HR_MANAGER', 'MANAGER','ADMINISTRATOR'), userController.getUsers);

// Get managers
router.get('/managers', authenticate, authorize('HR_MANAGER'), userController.getManagers);

// Get user by ID
router.get('/:id', authenticate, userController.getUserById);

// Create user (only HR)
router.post('/', userController.createUser);

// Only HR can update roles/users
router.put('/:id', authenticate, authorize('HR_MANAGER'), userController.updateUser);

// Only HR can deactivate users
router.delete('/:id', authenticate, authorize('HR_MANAGER'), userController.deleteUser);

// Any logged user can change password
router.put('/change-password', authenticate, userController.changePassword);

module.exports = router;
