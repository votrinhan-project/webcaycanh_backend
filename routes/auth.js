// backend/routes/auth.js

/**
 * @fileOverview Xử lý xác thực người dùng thông qua Google OAuth.
 * Sau khi xác thực thành công, thông tin người dùng được upsert vào CSDL và tạo JWT để chuyển về Frontend.
 */

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      // Upsert người dùng sử dụng cú pháp ON CONFLICT của PostgreSQL
      const upsertQuery = `
        INSERT INTO users (idGoogle, displayName, email, role)
        VALUES ($1, $2, $3, 'user')
        ON CONFLICT (idGoogle) DO UPDATE SET displayName = EXCLUDED.displayName, email = EXCLUDED.email
        RETURNING id, idGoogle, displayName, email, role
      `;
      const upsertResult = await pool.query(upsertQuery, [req.user.id, req.user.displayName, req.user.email]);
      if (upsertResult.rowCount > 0) {
        const userFromDB = upsertResult.rows[0];
        const token = jwt.sign({ user: userFromDB }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user_found`);
      }
    } catch (err) {
      console.error("Error upserting user:", err);
      const token = jwt.sign({ user: { displayName: req.user.displayName, email: req.user.email, idGoogle: req.user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}`);
    }
  }
);

module.exports = router;