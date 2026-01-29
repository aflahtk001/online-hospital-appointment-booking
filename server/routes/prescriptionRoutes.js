const express = require('express');
const router = express.Router();
const { createPrescription, getPatientPrescriptions, getPrescriptionById } = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('doctor'), createPrescription);

router.route('/patient/:patientId')
    .get(protect, getPatientPrescriptions); // Patient can view own, Doctor can view too

router.route('/:id')
    .get(protect, getPrescriptionById);

module.exports = router;
