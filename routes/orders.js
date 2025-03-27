// backend/routes/orders.js

/**
 * @fileOverview API xử lý các chức năng liên quan đến đơn hàng.
 * Bao gồm tạo đơn hàng, cập nhật trạng thái đơn hàng, lấy đơn hàng mới nhất của người dùng và chi tiết đơn hàng.
 */

const express = require("express");
const router = express.Router();
const pool = require("../models/db");

// Tạo đơn hàng mới từ giỏ hàng hoặc mua ngay
router.post("/", async (req, res) => {
  const { user_id, items } = req.body;
  try {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderResult = await pool.query(
      "INSERT INTO orders (user_id, total_amount, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id",
      [user_id, total, "pending"]
    );
    const orderId = orderResult.rows[0].id;
    for (let item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [orderId, item.product_id, item.quantity, item.price]
      );
    }
    res.json({ message: "Đơn hàng đã được tạo", orderId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật trạng thái đơn hàng
router.put('/update-status/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  try {
    const result = await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [status, orderId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order status updated successfully', orderId, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy đơn hàng mới nhất của người dùng theo userId
router.get('/latest', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }
  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No orders found for this user' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy tất cả đơn hàng của người dùng theo userId
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const ordersResult = await pool.query("SELECT * FROM orders WHERE user_id = $1", [userId]);
    const orders = ordersResult.rows;
    for (let order of orders) {
      const statusResult = await pool.query("SELECT status FROM order_status WHERE order_id = $1", [order.id]);
      order.status_detail = statusResult.rowCount > 0 ? statusResult.rows[0].status : "Chưa được xác nhận";
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy chi tiết đơn hàng theo orderId
router.get("/details/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [orderId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;