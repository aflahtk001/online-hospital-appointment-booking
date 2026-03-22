const express = require('express');
const router = express.Router();
const { 
    registerHospital, 
    getHospitals, 
    approveHospital, 
    rejectHospital, 
    getPendingHospitals, 
    getHospitalDetails, 
    getHospitalDoctors, 
    addDoctorToHospital, 
    getHospitalStats, 
    getHospitalsByStatus,
    uploadCertificate 
} = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .post(
        protect, 
        authorize('hospital_admin'), 
        upload.fields([
            { name: 'registrationCertificate', maxCount: 1 },
            { name: 'accreditationCertificate', maxCount: 1 }
        ]),
        registerHospital
    )
    .get(getHospitals);

router.route('/:id/approve')
    .put(protect, authorize('admin', 'super_admin'), approveHospital);

router.route('/:id/reject')
    .put(protect, authorize('admin', 'super_admin'), rejectHospital);

router.route('/admin/list')
    .get(protect, authorize('admin', 'super_admin'), getHospitalsByStatus);

router.route('/pending')
    .get(protect, authorize('admin', 'super_admin'), getPendingHospitals);

router.route('/me')
    .get(protect, authorize('hospital_admin'), getHospitalDetails);

router.route('/doctors')
    .get(protect, authorize('hospital_admin'), getHospitalDoctors)
    .post(protect, authorize('hospital_admin'), addDoctorToHospital);

router.route('/stats')
    .get(protect, authorize('hospital_admin'), getHospitalStats);

router.post('/upload-certificate', protect, authorize('hospital_admin'), upload.single('certificate'), uploadCertificate);

module.exports = router;
