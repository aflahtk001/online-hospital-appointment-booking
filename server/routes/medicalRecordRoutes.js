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
                const errorMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err)) || 'Unknown Upload Error';
                return res.status(500).json({ message: 'Image Upload Failed: ' + errorMessage });
            }
            next();
        });
    }, uploadRecord);

router.route('/patient/:patientId')
    .get(protect, getPatientRecords);

module.exports = router;
