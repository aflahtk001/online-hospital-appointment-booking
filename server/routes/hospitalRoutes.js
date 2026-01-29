const express = require('express');
const router = express.Router();
const { registerHospital, getHospitals, approveHospital, rejectHospital, getPendingHospitals, getHospitalDetails, getHospitalDoctors, addDoctorToHospital, getHospitalStats } = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('hospital_admin'), registerHospital)
    .get(getHospitals);

router.route('/:id/approve')
    .put(protect, authorize('admin', 'super_admin'), approveHospital);

router.route('/:id/reject')
    .delete(protect, authorize('admin', 'super_admin'), rejectHospital);

router.route('/pending')
    .get(protect, authorize('admin', 'super_admin'), getPendingHospitals);

router.route('/me')
    .get(protect, authorize('hospital_admin'), getHospitalDetails);

router.route('/doctors')
    .get(protect, authorize('hospital_admin'), getHospitalDoctors)
    .post(protect, authorize('hospital_admin'), addDoctorToHospital);

router.route('/stats')
    .get(protect, authorize('hospital_admin'), getHospitalStats);

module.exports = router;
