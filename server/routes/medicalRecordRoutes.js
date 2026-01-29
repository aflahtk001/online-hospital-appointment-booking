const express = require('express');
const router = express.Router();
const { uploadRecord, getPatientRecords } = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .post(protect, upload.single('file'), uploadRecord);

router.route('/patient/:patientId')
    .get(protect, getPatientRecords);

module.exports = router;
