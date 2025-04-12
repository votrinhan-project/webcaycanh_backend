// backend/routes/admin.js

/**
 * @fileOverview Các API dành cho quản trị (admin).
 * Bao gồm các chức năng: xem, cập nhật đơn hàng và thêm, sửa, xóa sản phẩm.
 */

const express = require("express");
const router = express.Router();
const pool = require("../models/db");
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const uploadFile = require('../utils/gcsUploader');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoint thêm sản phẩm mới và lưu ảnh
router.post('/products', upload.array('images', 10), async (req, res) => {
  const { ten_cay, ten_khoa_hoc, dac_diem, y_nghia_phong_thuy, loi_ich, gia } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO data (ten_cay, ten_khoa_hoc, dac_diem, y_nghia_phong_thuy, loi_ich, gia) \
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [ten_cay, ten_khoa_hoc, dac_diem, y_nghia_phong_thuy, loi_ich, gia]
    );
    const productId = result.rows[0].id;

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const processedBuffer = await sharp(file.buffer)
          .jpeg()
          .toBuffer();
        const destination = `${ten_cay}_${i + 1}.jpg`;

        const imageUrl = await uploadFile(processedBuffer, destination, 'image/jpeg');
        imageUrls.push(imageUrl);

        await pool.query(
          "INSERT INTO product_images (product_id, image_path) VALUES ($1, $2)",
          [productId, imageUrl]
        );
      }
    }
    res.json({ message: "Thêm sản phẩm thành công", productId, imageUrls });
  } catch (error) {
    console.error("Error in product upload:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint kiểm soát đơn hàng
router.get("/orders", async (req, res) => {
  try {
    const ordersResult = await pool.query("SELECT * FROM orders");
    const orders = ordersResult.rows;
    for (let order of orders) {
      const itemsResult = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
      order.items = itemsResult.rows;
      const statusResult = await pool.query("SELECT status FROM order_status WHERE order_id = $1", [order.id]);
      order.status_detail = statusResult.rows.length > 0 ? statusResult.rows[0].status : order.status;
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint cập nhật trạng thái đơn hàng
router.put("/orders/:orderId/status", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    const rowsResult = await pool.query("SELECT * FROM order_status WHERE order_id = $1", [orderId]);
    if (rowsResult.rowCount > 0) {
      await pool.query("UPDATE order_status SET status = $1 WHERE order_id = $2", [status, orderId]);
    } else {
      await pool.query("INSERT INTO order_status (order_id, status) VALUES ($1, $2)", [orderId, status]);
    }
    res.json({ message: "Cập nhật trạng thái đơn hàng thành công", orderId, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint cập nhật thông tin sản phẩm theo id
router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { ten_cay, ten_khoa_hoc, dac_diem, y_nghia_phong_thuy, loi_ich, gia } = req.body;
  try {
    await pool.query(
      "UPDATE data SET ten_cay = $1, ten_khoa_hoc = $2, dac_diem = $3, y_nghia_phong_thuy = $4, loi_ich = $5, gia = $6 WHERE id = $7",
      [ten_cay, ten_khoa_hoc, dac_diem, y_nghia_phong_thuy, loi_ich, gia, id]
    );
    res.json({ message: "Cập nhật sản phẩm thành công", id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint xóa sản phẩm
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM data WHERE id = $1", [id]);
    await pool.query("DELETE FROM product_images WHERE product_id = $1", [id]);
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
