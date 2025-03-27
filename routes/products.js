// backend/routes/products.js

/**
 * @fileOverview API quản lý sản phẩm.
 * Cho phép lấy danh sách sản phẩm và chi tiết sản phẩm theo id.
 */

const express = require("express");
const router = express.Router();
const pool = require("../models/db");

// Lấy danh sách tất cả sản phẩm
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM data");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy chi tiết sản phẩm theo id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM data WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Sản phẩm không tồn tại" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;