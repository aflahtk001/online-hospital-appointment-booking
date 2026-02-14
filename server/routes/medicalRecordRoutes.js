const express = require('express');
const router = express.Router();
const { uploadRecord, getPatientRecords } = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .post(protect, (req, res, next) => {
        upload.single('file')(req, res, (err) => {
            if (err) {
                console.error('Multer/Cloudinary Upload Error:', err);
                return res.status(500).json({ message: 'Image Upload Failed: ' + err.message });
            }
            next();
        });
    }, uploadRecord);

router.route('/patient/:patientId')
    .get(protect, getPatientRecords);

module.exports = router;
