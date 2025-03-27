// backend/models/db.js

/**
 * @fileOverview Thiết lập kết nối đến cơ sở dữ liệu PostgreSQL sử dụng pg.
 * Sử dụng pool kết nối với Promise để xử lý các truy vấn bất đồng bộ.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;