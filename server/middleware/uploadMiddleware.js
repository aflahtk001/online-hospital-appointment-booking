const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'hospital-medical-records',
        resource_type: 'auto', // supports images & PDFs
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf']
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
