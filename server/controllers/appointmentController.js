const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @desc    Book an Appointment
// @route   POST /api/appointments
// @access  Private (Patient)
// @desc    Book an Appointment
// @route   POST /api/appointments
// @access  Private (Patient)
const bookAppointment = async (req, res) => {
    const { doctorId, hospitalId, appointmentDate, type } = req.body;

    try {
        // Fix Timezone Issue: Convert incoming UTC date to IST (+05:30) explicitly 
        // using toLocaleDateString to get the correct YYYY-MM-DD in India Standard Time
        const appointmentDateObj = new Date(appointmentDate);
        const queueDateStr = appointmentDateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        
        const startOfDay = new Date(queueDateStr); // Normalization for other uses if needed

        // 1. Get Doctor details for Token Code (e.g., Dr. Smith -> S)
        const doctor = await Doctor.findById(doctorId).populate('user', 'name');
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const docName = doctor.user.name.split(' ').pop() || doctor.user.name; // Use last name or full name
        const docCode = docName.charAt(0).toUpperCase();
        const day = startOfDay.getDate().toString().padStart(2, '0');

        // 2. Find the last token for this Doctor + Hospital + Date (String Match)
        const lastAppointment = await Appointment.findOne({
            doctor: doctorId,
            hospital: hospitalId,
            queueDate: queueDateStr
        }).sort({ 'token.number': -1 });

        const newTokenNumber = lastAppointment ? lastAppointment.token.number + 1 : 1;
        const displayToken = `DR${docCode}-${day}-${String(newTokenNumber).padStart(3, '0')}`;

        const appointment = new Appointment({
            patient: req.patientId,
            doctor: doctorId,
            hospital: hospitalId,
            appointmentDate,
            queueDate: queueDateStr, // Saved as String "YYYY-MM-DD"
            type,
            token: {
                number: newTokenNumber,
                displayToken: displayToken,
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
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        // Fix: Use IST (Asia/Kolkata) for "Today" to match user timezone
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const appointments = await Appointment.find({
            doctor: doctor._id,
            queueDate: todayStr, // Exact string match for today
            'token.status': { $in: ['waiting', 'serving', 'skipped'] } // Active tokens
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
        const hospital = await Hospital.findOne({ admins: req.user.id });
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        // Fix: Use IST (Asia/Kolkata) for "Today" to match user timezone
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const appointments = await Appointment.find({
            hospital: hospital._id,
            queueDate: todayStr // Exact string match
        })
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .populate({
                path: 'patient',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ doctor: 1, 'token.number': 1 }); // Sort by Doctor then token number

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Appointments for Doctor by Date
// @route   GET /api/appointments/doctor/history
// @access  Private (Doctor)
const getDoctorAppointmentsByDate = async (req, res) => {
    try {
        const { date, status } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD)' });
        }

        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        // Ensure date is in YYYY-MM-DD string format (Convert input to IST)
        const dateObj = new Date(date);
        const searchDateStr = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const query = {
            doctor: doctor._id,
            queueDate: searchDateStr
        };

        if (status && status !== 'All') {
            query['token.status'] = status.toLowerCase();
        }

        const appointments = await Appointment.find(query)
            .populate({
                path: 'patient',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .sort({ 'token.number': 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Appointment Status
// @route   PUT /api/appointments/:id/status
// @access  Private (Doctor, Hospital Admin)
const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify ownership (Doctor or Hospital Admin)
        // Simplification: Allow if authenticated as Doctor or Hospital Admin
        // Ideally check if appointment.doctor == req.user.doctorProfileId etc.

        appointment.token.status = status;

        // If status is completed or cancelled, update main status too
        if (status === 'completed' || status === 'cancelled') {
            appointment.status = status;
        }

        const updatedAppointment = await appointment.save();
        res.json(updatedAppointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Active Queue for Patient
// @route   GET /api/appointments/patient/active
// @access  Private (Patient)
const getPatientActiveQueue = async (req, res) => {
    try {
        const Patient = require('../models/Patient');
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const activeAppointment = await Appointment.findOne({
            patient: patient._id,
            queueDate: todayStr,
            'token.status': { $in: ['waiting', 'serving'] }
        }).populate({
            path: 'doctor',
            populate: { path: 'user', select: 'name' }
        });

        if (!activeAppointment) {
            return res.json(null);
        }

        // Find what token is CURRENTLY SERVING for this doctor
        const currentServing = await Appointment.findOne({
            doctor: activeAppointment.doctor._id,
            queueDate: todayStr,
            'token.status': 'serving'
        });

        res.json({
            tokenNumber: activeAppointment.token.displayToken || activeAppointment.token.number,
            doctorName: activeAppointment.doctor?.user?.name,
            status: activeAppointment.token.status,
            currentServingToken: currentServing ? (currentServing.token.displayToken || currentServing.token.number) : 'Not Started'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { bookAppointment, getDoctorAppointments, getHospitalAppointments, getDoctorAppointmentsByDate, updateAppointmentStatus, getPatientActiveQueue };
