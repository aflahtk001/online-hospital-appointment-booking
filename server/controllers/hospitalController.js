const Hospital = require('../models/Hospital');
const User = require('../models/User');

// @desc    Register a new hospital (Hospital Admin)
// @route   POST /api/hospitals
// @access  Private (Hospital Admin)
const registerHospital = async (req, res) => {
    const { name, address, contactNumber, departments } = req.body;

    try {
        const hospital = new Hospital({
            name,
            admins: [req.user.id], // Creator is the first admin
            address,
            contactNumber,
            departments,
            isApproved: false // Pending super admin approval
        });

        const createdHospital = await hospital.save();

        // Link user to hospital
        await User.findByIdAndUpdate(req.user.id, { hospitalId: createdHospital._id });

        res.status(201).json(createdHospital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all hospitals (Public Search)
// @route   GET /api/hospitals
// @access  Public
const getHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find({ isApproved: true });
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve Hospital
// @route   PUT /api/hospitals/:id/approve
// @access  Private (Admin)
const approveHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        hospital.isApproved = true;
        await hospital.save();

        res.json({ message: 'Hospital approved successfully', hospital });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject Hospital
// @route   DELETE /api/hospitals/:id/reject
// @access  Private (Admin)
const rejectHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        await hospital.deleteOne();

        res.json({ message: 'Hospital rejected and removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Pending Hospitals
// @route   GET /api/hospitals/pending
// @access  Private (Admin)
const getPendingHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find({ isApproved: false });
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get My Hospital Details (Hospital Admin)
// @route   GET /api/hospitals/me
// @access  Private (Hospital Admin)
const getHospitalDetails = async (req, res) => {
    try {
        // Find hospital where the current user is listed as an admin
        const hospital = await Hospital.findOne({ admins: req.user.id });
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found for this admin' });
        }
        res.json(hospital);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Doctors of My Hospital
// @route   GET /api/hospitals/doctors
// @access  Private (Hospital Admin)
const getHospitalDoctors = async (req, res) => {
    try {
        // 1. Get the hospital ID for this admin
        const hospital = await Hospital.findOne({ admins: req.user.id });
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        // 2. Find doctors linked to this hospital
        const Doctor = require('../models/Doctor');
        const doctors = await Doctor.find({ hospital: hospital._id }).populate('user', 'name email');

        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add Doctor to Hospital (Hospital Admin)
// @route   POST /api/hospitals/doctors
// @access  Private (Hospital Admin)
timings: timings || "Mon-Fri: 09:00 - 17:00", // Use provided or Default
    status: 'approved' // Auto-approve
        });

res.status(201).json({ message: 'Doctor added successfully', doctor });
    } catch (error) {
    res.status(500).json({ message: error.message });
}
};

module.exports = { registerHospital, getHospitals, approveHospital, rejectHospital, getPendingHospitals, getHospitalDetails, getHospitalDoctors, addDoctorToHospital };
