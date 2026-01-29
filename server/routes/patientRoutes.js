const express = require('express');
const router = express.Router();
const { getPatientProfile, updatePatientProfile } = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/profile')
    .get(protect, authorize('patient'), getPatientProfile)
    .post(protect, authorize('patient'), updatePatientProfile);

module.exports = router;
