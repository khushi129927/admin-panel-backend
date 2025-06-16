const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'task_uploads',
    allowed_formats: ['jpg', 'png', 'mp4', 'mov'],
  },
});

const upload = multer({ storage });

module.exports = upload;
