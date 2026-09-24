const express = require('express');
const router = express.Router();
const controller = require('../controllers/department.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.post('/', authenticate, authorize('ADMINISTRATOR', 'HR_MANAGER'), controller.createDepartment);
router.get('/', authenticate, controller.getDepartments);
router.get('/:id', authenticate, controller.getDepartmentById);
router.put('/:id', authenticate, authorize('ADMINISTRATOR', 'HR_MANAGER'), controller.updateDepartment);
router.delete('/:id', authenticate, authorize('ADMINISTRATOR'), controller.deleteDepartment);

module.exports = router;