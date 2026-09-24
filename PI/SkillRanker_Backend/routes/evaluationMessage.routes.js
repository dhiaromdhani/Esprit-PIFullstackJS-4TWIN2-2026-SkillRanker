const express = require('express');
const router = express.Router();

const {
  createEvaluationMessage,
  getEmployeeEvaluationMessages,
  markEvaluationMessageAsRead
} = require('../controllers/evaluationMessage.controller');

router.post('/', createEvaluationMessage);

router.get('/employee/:identifier', getEmployeeEvaluationMessages);

router.patch('/:id/read', markEvaluationMessageAsRead);

module.exports = router;