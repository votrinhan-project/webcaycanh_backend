// backend/routes/users.js

/**
 * @fileOverview API quản lý thông tin người dùng.
 * Cho phép lấy thông tin người dùng và cập nhật thông tin cá nhân.
 */

const express = require("express");
const router = express.Router();
const pool = require("../models/db");

// Lấy thông tin người dùng theo idGoogle
router.get("/:idGoogle", async (req, res) => {
  const { idGoogle } = req.params;
  try {
    const result = await pool.query("SELECT id, displayName, email, phone, address FROM users WHERE idGoogle = $1", [idGoogle]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Người dùng không tồn tại" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật thông tin người dùng theo idGoogle
router.put("/:idGoogle", async (req, res) => {
  const { idGoogle } = req.params;
  const { phone, address, email } = req.body;
  try {
    await pool.query("UPDATE users SET phone = $1, address = $2, email = $3 WHERE idGoogle = $4", [phone, address, email, idGoogle]);
    res.json({ message: "Cập nhật thông tin người dùng thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;