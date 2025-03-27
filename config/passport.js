// backend/config/passport.js

/**
 * @fileOverview Cấu hình Passport với Google OAuth2.
 * Sử dụng để lấy thông tin clientID, clientSecret và callbackURL.
 */

require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value
      };
      return done(null, user);
    }
  )
);

module.exports = passport;