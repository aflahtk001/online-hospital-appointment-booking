const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @desc    Book an Appointment
// @route   POST /api/appointments
// @access  Private (Patient)
const bookAppointment = async (req, res) => {
    const { doctorId, hospitalId, appointmentDate, type } = req.body;

    try {
        // Simple token generation (count existing appointments for the day + 1)
        // In a real app, concurrency handling (e.g., redis or atomic updates) is needed
        const startOfDay = new Date(appointmentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(appointmentDate);
        endOfDay.setHours(23, 59, 59, 999);

        const count = await Appointment.countDocuments({
            doctor: doctorId,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay }
        });

        const tokenNumber = count + 1;

        const appointment = new Appointment({
            patient: req.patientId, // Needs middleware to attach patientId from userId
            doctor: doctorId,
            hospital: hospitalId,
            appointmentDate,
            type,
            token: {
                number: tokenNumber,
                status: 'waiting'
            }
        });

        const createdAppointment = await appointment.save();
        res.status(201).json(createdAppointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Appointments for Doctor (Queue)
// @route   GET /api/appointments/doctor
// @access  Private (Doctor)
const getDoctorAppointments = async (req, res) => {
    try {
        // Assuming req.user is linked to a Doctor profile
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        const appointments = await Appointment.find({
            doctor: doctor._id,
            status: 'scheduled' // or all
        }).populate({
            path: 'patient',
            populate: {
                path: 'user',
                select: 'name email'
            }
        }).sort({ 'token.number': 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Appointments for Hospital (Live Queue)
// @route   GET /api/appointments/hospital
// @access  Private (Hospital Admin)
const getHospitalAppointments = async (req, res) => {
    try {
        const Hospital = require('../models/Hospital');
        // Find hospital managed by this user
        const hospital = await Hospital.findOne({ admins: req.user.id });
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        const appointments = await Appointment.find({
            hospital: hospital._id,
            appointmentDate: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lte: new Date(new Date().setHours(23, 59, 59, 999))
            } // Only today's appointments
        })
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .populate({
                path: 'patient',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ 'token.number': 1 }); // Sort by token number

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { bookAppointment, getDoctorAppointments, getHospitalAppointments };
