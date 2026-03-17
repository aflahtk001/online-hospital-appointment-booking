const express = require('express');
const router = express.Router();
const { updateDoctorProfile, getDoctorProfile, getAllDoctors, approveDoctor, rejectDoctor, getPendingDoctors, checkTrustScore, getDoctorsByStatus, uploadIMRCertificate } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/imr-certificate')
    .post(protect, authorize('doctor'), upload.single('certificate'), uploadIMRCertificate);

router.route('/profile')
    .post(protect, authorize('doctor'), updateDoctorProfile)
    .get(protect, authorize('doctor'), getDoctorProfile);

router.route('/:id/check-trust-score')
    .post(protect, authorize('admin', 'super_admin'), checkTrustScore);

router.route('/:id/approve')
    .put(protect, authorize('admin', 'super_admin'), approveDoctor);

router.route('/:id/reject')
    .put(protect, authorize('admin', 'super_admin'), rejectDoctor);

router.route('/admin/list')
    .get(protect, authorize('admin', 'super_admin'), getDoctorsByStatus);

router.route('/pending')
    .get(protect, authorize('admin', 'super_admin'), getPendingDoctors);

router.route('/')
    .get(getAllDoctors); // Publicly accessible for search

module.exports = router;
