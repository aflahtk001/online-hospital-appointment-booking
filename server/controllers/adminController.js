const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

// @desc    Get System Stats
// @route   GET /api/admin/stats
// @access  Private (Super Admin)
const getSystemStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDoctors = await Doctor.countDocuments({ status: 'approved' });
        const totalHospitals = await Hospital.countDocuments({ isApproved: true });
        const totalAppointments = await Appointment.countDocuments();

        res.json({
            totalUsers,
            totalDoctors,
            totalHospitals,
            totalAppointments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSystemStats };
