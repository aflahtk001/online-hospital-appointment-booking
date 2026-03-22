const Notification = require('../models/Notification');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');

// @desc    Get logged in user's notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('sender', 'name role')
            .sort({ createdAt: -1 });
        
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Make sure it belongs to the user
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a notification to a specific group based on role
// @route   POST /api/notifications/send
// @access  Private
const sendNotification = async (req, res) => {
    const { targetGroup, message } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;

    if (!message || !targetGroup) {
        return res.status(400).json({ message: 'Message and target group are required' });
    }

    try {
        let recipientIds = [];

        // 1. Super Admin Sending Logic
        if (senderRole === 'super_admin') {
            if (targetGroup === 'all_hospitals') {
                const hospitals = await User.find({ role: 'hospital_admin' }).select('_id');
                recipientIds = hospitals.map(h => h._id);
            } else if (targetGroup === 'all_doctors') {
                const doctors = await User.find({ role: 'doctor' }).select('_id');
                recipientIds = doctors.map(d => d._id);
            } else if (targetGroup === 'all_patients') {
                const patients = await User.find({ role: 'patient' }).select('_id');
                recipientIds = patients.map(p => p._id);
            } else {
                return res.status(400).json({ message: 'Invalid target group for Super Admin' });
            }
        } 
        
        // 2. Hospital Admin Sending Logic
        else if (senderRole === 'hospital_admin') {
            if (targetGroup === 'hospital_doctors') {
                const hospital = await Hospital.findOne({ admins: senderId });
                if (!hospital) return res.status(404).json({ message: 'Hospital profile not found' });

                const doctors = await User.find({ role: 'doctor', hospitalId: hospital._id }).select('_id');
                recipientIds = doctors.map(d => d._id);
            } else {
                return res.status(400).json({ message: 'Invalid target group for Hospital Admin' });
            }
        } 
        
        // 3. Doctor Sending Logic
        else if (senderRole === 'doctor') {
            const doctorProfile = await Doctor.findOne({ user: senderId });
            if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

            if (targetGroup === 'patients_today' || targetGroup === 'patients_all') {
                let appointmentQuery = { doctor: doctorProfile._id };

                if (targetGroup === 'patients_today') {
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date();
                    endOfDay.setHours(23, 59, 59, 999);
                    
                    appointmentQuery.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
                }

                // Get distinct patient IDs from appointments
                const appointments = await Appointment.find(appointmentQuery).select('patient');
                // Extract unique user IDs from the Patients
                const uniquePatientProfiles = [...new Set(appointments.map(a => a.patient.toString()))];
                
                // Now find the actual User IDs for these Patient profiles
                // We need to look up Patient model to get user reference
                const Patient = require('../models/Patient');
                const patientDocs = await Patient.find({ _id: { $in: uniquePatientProfiles } }).select('user');
                
                recipientIds = patientDocs.map(p => p.user);
            } else {
                return res.status(400).json({ message: 'Invalid target group for Doctor' });
            }
        } else {
            return res.status(403).json({ message: 'Role not authorized to send mass notifications' });
        }

        // Remove duplicates and self
        recipientIds = [...new Set(recipientIds.map(id => id.toString()))].filter(id => id !== senderId.toString());

        if (recipientIds.length === 0) {
            return res.status(200).json({ message: 'No recipients found in the selected group', count: 0 });
        }

        // Create notification documents
        const notificationsToInsert = recipientIds.map(recipientId => ({
            recipient: recipientId,
            sender: senderId,
            message,
            type: 'general'
        }));

        await Notification.insertMany(notificationsToInsert);

        res.status(200).json({ 
            message: `Notification sent successfully to ${recipientIds.length} users`,
            count: recipientIds.length
        });

    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    sendNotification
};
