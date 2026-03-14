const express = require('express');
const router = express.Router();
const { updateDoctorProfile, getDoctorProfile, getAllDoctors, approveDoctor, rejectDoctor, getPendingDoctors, checkTrustScore } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/profile')
    .post(protect, authorize('doctor'), updateDoctorProfile)
    .get(protect, authorize('doctor'), getDoctorProfile);

router.route('/:id/check-trust-score')
    .post(protect, authorize('admin', 'super_admin'), checkTrustScore);

router.route('/:id/approve')
    .put(protect, authorize('admin', 'super_admin'), approveDoctor);

router.route('/:id/reject')
    .put(protect, authorize('admin', 'super_admin'), rejectDoctor);

router.route('/pending')
    .get(protect, authorize('admin', 'super_admin'), getPendingDoctors);

router.route('/')
    .get(getAllDoctors); // Publicly accessible for search

module.exports = router;
