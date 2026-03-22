const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

// @desc    Get System Stats
// @route   GET /api/admin/stats
// @access  Private (Super Admin)
const getSystemStats = async (req, res) => {
    try {
        const { date, month } = req.query;
        const totalPatients = await User.countDocuments({ role: 'patient' });
        const totalDoctors = await Doctor.countDocuments({ status: 'approved' });
        const totalHospitals = await Hospital.countDocuments({ status: 'approved' });
        const totalAppointments = await Appointment.countDocuments();

        // Specific Date Appointments for the main stats cards
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

        // --- Monthly Graph Data Aggregation ---
        let startOfMonth, endOfMonth;
        if (month) {
            // month format YYYY-MM
            const [yearStr, monthStr] = month.split('-');
            startOfMonth = new Date(yearStr, parseInt(monthStr) - 1, 1);
            endOfMonth = new Date(yearStr, parseInt(monthStr), 0, 23, 59, 59, 999);
        } else {
            // Default to current month
            const now = new Date();
            startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const daysInMonth = endOfMonth.getDate();
        
        // Helper function for aggregation
        const getDailyCounts = async (Model, dateField, query = {}) => {
            const results = await Model.aggregate([
                { $match: { ...query, [dateField]: { $gte: startOfMonth, $lte: endOfMonth } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } },
                        count: { $sum: 1 }
                    }
                }
            ]);
            
            const dict = {};
            results.forEach(r => dict[r._id] = r.count);
            return dict;
        };

        const [patientCounts, appointmentCounts, doctorCounts, hospitalCounts] = await Promise.all([
            getDailyCounts(User, 'createdAt', { role: 'patient' }),
            getDailyCounts(Appointment, 'createdAt'),
            getDailyCounts(Doctor, 'createdAt', { status: 'approved' }),
            getDailyCounts(Hospital, 'createdAt', { status: 'approved' })
        ]);

        const dailyStats = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const dayString = i.toString().padStart(2, '0');
            const monthString = (startOfMonth.getMonth() + 1).toString().padStart(2, '0');
            const dateStr = `${startOfMonth.getFullYear()}-${monthString}-${dayString}`;
            
            dailyStats.push({
                date: dayString, 
                fullDate: dateStr,
                patients: patientCounts[dateStr] || 0,
                appointments: appointmentCounts[dateStr] || 0,
                doctors: doctorCounts[dateStr] || 0,
                hospitals: hospitalCounts[dateStr] || 0
            });
        }

        res.json({
            totalPatients,
            totalDoctors,
            totalHospitals,
            totalAppointments,
            dateAppointments,
            dailyStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSystemStats };
