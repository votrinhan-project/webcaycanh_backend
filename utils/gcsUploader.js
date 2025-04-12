// backend/utils/gcsUploader.js

/**
 * @fileOverview Hàm dùng để upload hình ảnh lên GCS.
 */

const { Storage } = require('@google-cloud/storage');
const bucketName = process.env.GCS_BUCKET_NAME;

const storage = new Storage({
  credentials: JSON.parse(process.env.GCS_CREDENTIALS),
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
});

const bucket = storage.bucket(bucketName);

/**
 * Upload file buffer lên Google Cloud Storage.
 * @param {Buffer} fileBuffer - Dữ liệu file cần upload.
 * @param {string} destination - Tên file lưu trên GCS, ví dụ: "ten_cay_123_1617171717_1.jpg".
 * @param {string} mimeType - Kiểu nội dung của file, ví dụ: "image/jpeg".
 * @returns {Promise<string>} URL công khai của file đã upload.
 */
async function uploadFile(fileBuffer, destination, mimeType) {
  const file = bucket.file(destination);
  const stream = file.createWriteStream({
    metadata: { contentType: mimeType },
    resumable: false
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (err) => {
      console.error('Lỗi upload GCS:', err);
      reject(err);
    });

    stream.on('finish', async () => {
      await file.makePublic().catch(err => {
        console.warn(`Không thể makePublic() file ${destination}:`, err);
      });
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
      resolve(publicUrl);
    });

    stream.end(fileBuffer);
  });
}

module.exports = uploadFile;