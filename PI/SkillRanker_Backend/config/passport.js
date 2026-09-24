/*const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
let GitHubStrategy;
let LinkedInStrategy;

try {
  GitHubStrategy = require('passport-github2').Strategy;
} catch (error) {
  console.warn('passport-github2 is not installed. GitHub OAuth will be disabled.');
}

try {
  LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
} catch (error) {
  console.warn('passport-linkedin-oauth2 is not installed. LinkedIn OAuth will be disabled.');
}

const User = require('../models/User'); // adjust path to your User model

const oauthCallback = async (profile, provider, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const oauthKey = provider === 'github' ? 'oauth.githubId' : 'oauth.linkedinId';
    const query = provider === 'github'
      ? { 'oauth.githubId': profile.id }
      : { 'oauth.linkedinId': profile.id };

    let user = await User.findOne(query);
    if (!user && email) user = await User.findOne({ email });

    if (!user) {
      const baseData = {
        firstName: profile.displayName || profile.name?.givenName || 'OAuthUser',
        lastName: profile.name?.familyName || '',
        email,
        role: 'EMPLOYEE',
        oauth: {
          githubId: provider === 'github' ? profile.id : undefined,
          linkedinId: provider === 'linkedin' ? profile.id : undefined
        }
      };
      user = await User.create(baseData);
    } else {
      user.oauth = user.oauth || {};
      if (provider === 'github') user.oauth.githubId = profile.id;
      if (provider === 'linkedin') user.oauth.linkedinId = profile.id;
      await user.save();
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            role: 'EMPLOYEE'
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

if (GitHubStrategy) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/github/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    await oauthCallback(profile, 'github', done);
  }));
}

if (LinkedInStrategy) {
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`,
    scope: ['r_liteprofile', 'r_emailaddress']
  }, async (accessToken, refreshToken, profile, done) => {
    await oauthCallback(profile, 'linkedin', done);
  }));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});
*/


/* athya yekhdem github w google
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

let GitHubStrategy;
let LinkedInStrategy;

try {
  GitHubStrategy = require('passport-github2').Strategy;
} catch (error) {
  console.warn('passport-github2 is not installed. GitHub OAuth will be disabled.');
}

try {
  LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
} catch (error) {
  console.warn('passport-linkedin-oauth2 is not installed. LinkedIn OAuth will be disabled.');
}

// ─── OAuth Shared Callback ────────────────────────────────────────────────────
const oauthCallback = async (profile, provider, done) => {
  try {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(null, false, {
        message: `No email found in your ${provider} profile. Please make your email public on ${provider} and try again.`
      });
    }

    const query = provider === 'github'
      ? { 'oauth.githubId': profile.id }
      : { 'oauth.linkedinId': profile.id };

    let user = await User.findOne(query);
    if (!user) user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firstName: profile.displayName || profile.name?.givenName || 'OAuthUser',
        lastName: profile.name?.familyName || '',
        email,
        role: 'EMPLOYEE',
        oauth: {
          githubId: provider === 'github' ? profile.id : undefined,
          linkedinId: provider === 'linkedin' ? profile.id : undefined
        }
      });
    } else {
      user.oauth = user.oauth || {};
      if (provider === 'github') user.oauth.githubId = profile.id;
      if (provider === 'linkedin') user.oauth.linkedinId = profile.id;
      await user.save();
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
};

// ─── Google Strategy ──────────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: 'No email returned from Google.' });
        }

        let user = await User.findOne({ googleId: profile.id });
        if (!user) user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            role: 'EMPLOYEE'
          });
        } else {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ─── GitHub Strategy ──────────────────────────────────────────────────────────
if (GitHubStrategy) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      await oauthCallback(profile, 'github', done);
    }
  ));
}

// ─── LinkedIn Strategy ────────────────────────────────────────────────────────
if (LinkedInStrategy) {
  passport.use(new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`,
      scope: ['r_liteprofile', 'r_emailaddress']
    },
    async (accessToken, refreshToken, profile, done) => {
      await oauthCallback(profile, 'linkedin', done);
    }
  ));
}

// ─── Serialize / Deserialize ──────────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
*/



const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OpenIDConnectStrategy = require('passport-openidconnect').Strategy;
const User = require('../models/User');

let GitHubStrategy;

try {
  GitHubStrategy = require('passport-github2').Strategy;
} catch (error) {
  console.warn('passport-github2 is not installed. GitHub OAuth will be disabled.');
}

// ─── OAuth Shared Callback ────────────────────────────────────────────────────
const oauthCallback = async (profile, provider, done) => {
  try {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(null, false, {
        message: `No email found in your ${provider} profile. Please make your email public on ${provider} and try again.`
      });
    }

    const query = provider === 'github'
      ? { 'oauth.githubId': profile.id }
      : { 'oauth.linkedinId': profile.id };

    let user = await User.findOne(query);
    if (!user) user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firstName: profile.displayName || profile.name?.givenName || 'OAuthUser',
        lastName: profile.name?.familyName || '',
        email,
        role: 'EMPLOYEE',
        oauth: {
          githubId: provider === 'github' ? profile.id : undefined,
          linkedinId: provider === 'linkedin' ? profile.id : undefined
        }
      });
    } else {
      user.oauth = user.oauth || {};
      if (provider === 'github') user.oauth.githubId = profile.id;
      if (provider === 'linkedin') user.oauth.linkedinId = profile.id;
      await user.save();
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
};

// ─── Google Strategy ──────────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'https://chowder-snooze-mutt.ngrok-free.dev'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: 'No email returned from Google.' });
        }

        let user = await User.findOne({ googleId: profile.id });
        if (!user) user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            role: 'EMPLOYEE'
          });
        } else {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ─── GitHub Strategy ──────────────────────────────────────────────────────────
if (GitHubStrategy) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'https://chowder-snooze-mutt.ngrok-free.dev'}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      await oauthCallback(profile, 'github', done);
    }
  ));
}

// ─── LinkedIn Strategy (OpenID Connect) ──────────────────────────────────────
const LINKEDIN_CALLBACK_URL = `${process.env.BACKEND_URL || 'https://chowder-snooze-mutt.ngrok-free.dev'}/api/auth/linkedin/callback`;
console.log('✅ LinkedIn callbackURL:', LINKEDIN_CALLBACK_URL); // ← copie cette valeur dans la console LinkedIn

passport.use('linkedin', new OpenIDConnectStrategy(
  {
    issuer: 'https://www.linkedin.com',
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoURL: 'https://api.linkedin.com/v2/userinfo',
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: LINKEDIN_CALLBACK_URL,
    scope: ['openid', 'profile', 'email'],
    skipUserProfile: false,
  },
  async (issuer, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;

      if (!email) {
        return done(null, false, {
          message: 'No email found in your LinkedIn profile. Please ensure your email is visible and try again.'
        });
      }

      let user = await User.findOne({ 'oauth.linkedinId': profile.id });
      if (!user) user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          firstName: profile.name?.givenName || profile.displayName || 'LinkedInUser',
          lastName: profile.name?.familyName || '',
          email,
          role: 'EMPLOYEE',
          oauth: { linkedinId: profile.id }
        });
      } else {
        user.oauth = user.oauth || {};
        user.oauth.linkedinId = profile.id;
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// ─── Serialize / Deserialize ──────────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;