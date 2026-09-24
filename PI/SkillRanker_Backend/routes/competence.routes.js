const express = require('express');
const router = express.Router();
const controller = require('../controllers/competence.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.post('/', authenticate, authorize('HR_MANAGER', 'MANAGER'), controller.createCompetence);
router.get('/', authenticate, controller.getCompetences);
router.get('/:id', authenticate, controller.getCompetenceById);
router.put('/:id', authenticate, authorize('HR_MANAGER', 'MANAGER'), controller.updateCompetence);
router.delete('/:id', authenticate, authorize('HR_MANAGER'), controller.deleteCompetence);

module.exports = router;