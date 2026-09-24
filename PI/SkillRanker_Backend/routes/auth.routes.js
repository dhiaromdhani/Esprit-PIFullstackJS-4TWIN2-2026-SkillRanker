// const express = require('express');
// const AuthController = require('../controllers/AuthController');
// const { authenticate } = require('../middlewares/auth.middleware');
// const { auditLog } = require('../middlewares/audit.middleware');

// const router = express.Router();

// router.post('/register', AuthController.register);
// router.post('/login', AuthController.login);
// router.post('/refresh', AuthController.refresh);
// router.post('/logout', authenticate, auditLog('LOGOUT', 'AUTH'), AuthController.logout);
// router.get('/me', authenticate, (req, res) => {
//   res.json(req.user);
// });


// const passport = require('passport');
// const jwt = require('jsonwebtoken');

// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
//   const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
//   res.redirect(`https://chowder-snooze-mutt.ngrok-free.dev/oauth-success?token=${token}`);
// });

// // Check if GitHub strategy is available
// let githubAvailable = false;
// try {
//   require('passport-github2');
//   githubAvailable = true;
// } catch (error) {
//   console.warn('GitHub OAuth disabled: passport-github2 not installed');
// }

// if (githubAvailable) {
//   router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

//   router.get('/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
//     const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
//     res.redirect(`https://chowder-snooze-mutt.ngrok-free.dev/oauth-success?token=${token}`);
//   });
// }

// // Check if LinkedIn strategy is available
// let linkedinAvailable = false;
// try {
//   require('passport-linkedin-oauth2');
//   linkedinAvailable = true;
// } catch (error) {
//   console.warn('LinkedIn OAuth disabled: passport-linkedin-oauth2 not installed');
// }

// if (linkedinAvailable) {
//   router.get('/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));

//   router.get('/linkedin/callback', passport.authenticate('linkedin', { session: false }), (req, res) => {
//     const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
//     res.redirect(`https://chowder-snooze-mutt.ngrok-free.dev/oauth-success?token=${token}`);
//   });
// }

// module.exports = router;
const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middlewares/auth.middleware');
const { auditLog } = require('../middlewares/audit.middleware');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ─── Auth classique ───────────────────────────────────────────────────────────
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
// router.post('/refresh', AuthController.refresh);
// router.post('/logout', authenticate, auditLog('LOGOUT', 'AUTH'), AuthController.logout);
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

// ─── Google ───────────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.redirect(`https://chowder-snooze-mutt.ngrok-free.dev/oauth-success?token=${token}`);
  }
);

// ─── GitHub ───────────────────────────────────────────────────────────────────
let githubAvailable = false;
try {
  require('passport-github2');
  githubAvailable = true;
} catch (error) {
  console.warn('GitHub OAuth disabled: passport-github2 not installed');
}

if (githubAvailable) {
  router.get('/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );

  router.get('/github/callback',
    passport.authenticate('github', { session: false }),
    (req, res) => {
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      res.redirect(`https://chowder-snooze-mutt.ngrok-free.dev/oauth-success?token=${token}`);
    }
  );
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────
router.get('/linkedin',
  passport.authenticate('linkedin')
);

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.redirect(`https://chowder-snooze-mutt.ngrok-free.dev/oauth-success?token=${token}`);
  }
);

module.exports = router;
