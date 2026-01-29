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
const addDoctorToHospital = async (req, res) => {
    const { name, email, password, specialization, experience, feesPerConsultation } = req.body;

    try {
        const hospital = await Hospital.findOne({ admins: req.user.id });
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // 2. Create User
        user = await User.create({
            name,
            email,
            password,
            role: 'doctor',
            isApproved: true, // Auto-approve since added by Hospital Admin
            hospitalId: hospital._id
        });

        // 3. Create Doctor Profile
        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.create({
            user: user._id,
            hospital: hospital._id,
            specialization,
            experience: experience || 0,
            feesPerConsultation: feesPerConsultation || 0,
            qualifications: ['MBBS'], // Default or add to form
            timings: { "Mon-Fri": "09:00 - 17:00" }, // Default
            status: 'approved' // Auto-approve
        });

        res.status(201).json({ message: 'Doctor added successfully', doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerHospital, getHospitals, approveHospital, rejectHospital, getPendingHospitals, getHospitalDetails, getHospitalDoctors, addDoctorToHospital };
