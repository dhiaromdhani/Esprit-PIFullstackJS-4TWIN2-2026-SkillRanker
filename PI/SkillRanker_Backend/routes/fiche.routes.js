// const express = require('express');
// const router = express.Router();
// const controller = require('../controllers/fiche.controller');
// const { authenticate } = require('../middlewares/auth.middleware');
// const authorize = require('../middlewares/authorize');

// router.post('/', authenticate, authorize('HR_MANAGER', 'MANAGER'), controller.createFiche);
// router.get('/', authenticate, controller.getFiches);
// router.get('/:id', authenticate, controller.getFicheById);
// router.put('/:id', authenticate, authorize('HR_MANAGER', 'MANAGER'), controller.updateFiche);
// router.delete('/:id', authenticate, authorize('HR_MANAGER'), controller.deleteFiche);

// module.exports = router;
const express = require('express');
const router = express.Router();

const controller = require('../controllers/fiche.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.post(
  '/',
  authenticate,
  authorize('HR_MANAGER', 'MANAGER'),
  controller.createFiche
);

router.get('/', authenticate, controller.getFiches);

router.get('/:id', authenticate, controller.getFicheById);

router.put(
  '/:id',
  authenticate,
  authorize('HR_MANAGER', 'MANAGER'),
  controller.updateFiche
);

router.delete(
  '/:id',
  authenticate,
  authorize('HR_MANAGER'),
  controller.deleteFiche
);

module.exports = router;