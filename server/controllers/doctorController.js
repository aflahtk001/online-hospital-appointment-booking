const Doctor = require('../models/Doctor');
const User = require('../models/User');

// @desc    Onboard/Update Doctor Profile
// @route   POST /api/doctors/profile
// @access  Private (Doctor)
const updateDoctorProfile = async (req, res) => {
    const { specialization, qualifications, experience, feesPerConsultation, bio, timings } = req.body;

    try {
        let doctor = await Doctor.findOne({ user: req.user.id });

        if (doctor) {
            // Update
            doctor.specialization = specialization || doctor.specialization;
            doctor.qualifications = qualifications || doctor.qualifications;
            doctor.experience = experience || doctor.experience;
            doctor.feesPerConsultation = feesPerConsultation || doctor.feesPerConsultation;
            doctor.bio = bio || doctor.bio;
            doctor.timings = timings || doctor.timings;

            const updatedDoctor = await doctor.save();
            res.json(updatedDoctor);
        } else {
            // Create
            doctor = new Doctor({
                user: req.user.id,
                specialization,
                qualifications,
                experience,
                feesPerConsultation,
                bio,
                timings,
                status: 'pending' // Force pending on new creation
            });

            const createdDoctor = await doctor.save();
            res.json(createdDoctor);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Doctor Profile
// @route   GET /api/doctors/profile
// @access  Private (Doctor)
const getDoctorProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ user: req.user.id }).populate('user', 'name email');
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Doctors (Public/Search)
// @route   GET /api/doctors
// @access  Public
const getAllDoctors = async (req, res) => {
    try {
        const { specialization, minExperience, maxFees } = req.query;

        let query = { status: 'approved' }; // Always only approved doctors

        if (specialization) {
            query.specialization = { $regex: specialization, $options: 'i' };
        }
        if (minExperience) {
            query.experience = { $gte: Number(minExperience) };
        }
        if (maxFees) {
            query.feesPerConsultation = { $lte: Number(maxFees) };
        }

        const doctors = await Doctor.find(query).populate('user', 'name email');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve Doctor
// @route   PUT /api/doctors/:id/approve
// @access  Private (Admin)
const approveDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        doctor.status = 'approved';
        doctor.isApproved = true; // Sync with User model field if needed, or just rely on Doctor status
        await doctor.save();

        // Also update User model status if we want unified login check
        await User.findByIdAndUpdate(doctor.user, { isApproved: true });

        res.json({ message: 'Doctor approved successfully', doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject Doctor
// @route   PUT /api/doctors/:id/reject
// @access  Private (Admin)
const rejectDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        doctor.status = 'rejected';
        await doctor.save();

        // Optionally reject user access
        // await User.findByIdAndUpdate(doctor.user, { isApproved: false });

        res.json({ message: 'Doctor rejected', doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Pending Doctors
// @route   GET /api/doctors/pending
// @access  Private (Admin)
const getPendingDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ status: 'pending' }).populate('user', 'name email');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { updateDoctorProfile, getDoctorProfile, getAllDoctors, approveDoctor, rejectDoctor, getPendingDoctors };
