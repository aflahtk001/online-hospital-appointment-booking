const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @desc    Create new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res) => {
    const { appointmentId, patientId, medicines, diagnosis, notes } = req.body;

    try {
        // Verify Doctor matches User
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const prescription = await Prescription.create({
            appointment: appointmentId,
            doctor: doctor._id,
            patient: patientId,
            medicines,
            diagnosis,
            notes
        });

        // Optionally update appointment status to 'completed'
        await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });

        res.status(201).json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get prescriptions for a patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private (Doctor/Patient/Admin)
const getPatientPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patient: req.params.patientId })
            .populate('doctor')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ date: -1 });
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('doctor')
            .populate('patient')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .populate({
                path: 'patient',
                populate: { path: 'user', select: 'name' }
            });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }
        res.json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createPrescription, getPatientPrescriptions, getPrescriptionById };
