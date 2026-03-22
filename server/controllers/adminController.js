const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

// @desc    Get System Stats
// @route   GET /api/admin/stats
// @access  Private (Super Admin)
const getSystemStats = async (req, res) => {
    try {
        const { date } = req.query;
        const totalPatients = await User.countDocuments({ role: 'patient' });
        const totalDoctors = await Doctor.countDocuments({ status: 'approved' });
        const totalHospitals = await Hospital.countDocuments({ status: 'approved' });
        const totalAppointments = await Appointment.countDocuments();

        // Specific Date Appointments
        let dateAppointments = 0;
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            dateAppointments = await Appointment.countDocuments({
                appointmentDate: { $gte: startOfDay, $lte: endOfDay }
            });
        } else {
            // Default to today
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);
            dateAppointments = await Appointment.countDocuments({
                appointmentDate: { $gte: startOfToday, $lte: endOfToday }
            });
        }

        res.json({
            totalPatients,
            totalDoctors,
            totalHospitals,
            totalAppointments,
            dateAppointments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSystemStats };
