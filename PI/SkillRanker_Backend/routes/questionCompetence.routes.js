const express = require('express');
const router = express.Router();
const controller = require('../controllers/questionCompetence.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.post('/', authenticate, authorize('HR_MANAGER', 'ADMINISTRATOR'), controller.createQuestionCompetence);
router.get('/', authenticate, controller.getQuestionCompetences);
router.get('/:id', authenticate, controller.getQuestionCompetenceById);
router.put('/:id', authenticate, authorize('HR_MANAGER', 'ADMINISTRATOR'), controller.updateQuestionCompetence);
router.delete('/:id', authenticate, authorize('ADMINISTRATOR'), controller.deleteQuestionCompetence);

module.exports = router;