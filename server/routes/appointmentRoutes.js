const express = require('express');
const router = express.Router();
const { bookAppointment, getDoctorAppointments, getHospitalAppointments } = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Custom middleware to get Patient ID from User ID would be useful here
// For now, assuming bookAppointment handles the lookup or req.body has it?
// Actually, safer to derive from req.user.id

router.post('/', protect, authorize('patient'), async (req, res, next) => {
    // Quick inline middleware to find patient profile
    const Patient = require('../models/Patient');
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) return res.status(404).json({ message: 'Create patient profile first' });
    req.patientId = patient._id;
    next();
}, bookAppointment);

router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);

router.route('/hospital')
    .get(protect, authorize('hospital_admin'), getHospitalAppointments);

module.exports = router;
