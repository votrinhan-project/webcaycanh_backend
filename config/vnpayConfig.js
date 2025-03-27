// backend/config/vnpayConfig.js

/**
 * @fileOverview Cấu hình VNPay.
 * Các thông tin cấu hình bao gồm TMN Code, Hash Secret, URL và Return URL.
 */

module.exports = {
  vnp_TmnCode: process.env.VNP_TMNCODE,
  vnp_HashSecret: process.env.VNP_HASHSECRET,
  vnp_Url: process.env.VNP_URL,
  vnp_ReturnUrl: process.env.VNP_RETURNURL
};