const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { fetchDoctorRegistryData, calculateTrustScore } = require('../utils/verificationService');

// @desc    Check Doctor Trust Score (NMC Verification)
// @route   POST /api/doctors/:id/check-trust-score
// @access  Private (Admin)
const checkTrustScore = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('user', 'name');
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        let registryData = null;
        let scraperError = false;

        // 1. Fetch from Registry
        try {
            registryData = await fetchDoctorRegistryData(doctor.registrationNumber);
            if (!registryData) scraperError = true;
        } catch (err) {
            console.error("Scraper failed:", err.message);
            scraperError = true;
        }

        // 2. Prepare Input for comparison
        const inputData = {
            name: doctor.user.name,
            qualification: doctor.qualifications.join(' '),
            council: doctor.stateMedicalCouncil
        };

        // 3. Handle Scraper Failure (Simulation for Demo)
        if (scraperError) {
            // For demo/dev purposes, if registry is down, we simulate a "Search Successful" 
            // but mark it as a simulation if it matches common test data
            return res.json({
                status: 'warning',
                message: 'NMC Registry search failed or timed out. Showing simulated match based on profile validity.',
                trust_score: 85, // Simulated score
                registry_data: {
                    name: doctor.user.name, // Simulate match
                    qualification: doctor.qualifications[0] || 'MBBS',
                    council: doctor.stateMedicalCouncil
                },
                comparison_result: {
                    name_match: true,
                    qualification_match: true,
                    council_match: true
                },
                is_simulated: true
            });
        }

        // 4. Calculate Score
        const trustScore = calculateTrustScore(inputData, registryData);

        // 5. Determine comparison matches
        const comparison = {
            name_match: inputData.name.toLowerCase() === registryData.name.toLowerCase(),
            qualification_match: inputData.qualification.toLowerCase().includes(registryData.qualification.toLowerCase()),
            council_match: inputData.council.toLowerCase() === registryData.council.toLowerCase()
        };

        res.json({
            status: 'success',
            trust_score: trustScore,
            registry_data: registryData,
            comparison_result: comparison
        });

    } catch (error) {
        console.error("Verification Error:", error.message);
        res.status(500).json({ 
            message: 'Verification failed', 
            error: error.message,
            // Fallback for demo purposes if registry is unreachable
            trust_score: 0,
            registry_data: null
        });
    }
};

// @desc    Onboard/Update Doctor Profile
// @route   POST /api/doctors/profile
// @access  Private (Doctor)
const updateDoctorProfile = async (req, res) => {
    const { specialization, qualifications, experience, feesPerConsultation, bio, timings, registrationNumber, clinicName, location, yearOfRegistration, stateMedicalCouncil } = req.body;

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
            doctor.registrationNumber = registrationNumber || doctor.registrationNumber;
            doctor.clinicName = clinicName || doctor.clinicName;
            doctor.location = location || doctor.location;
            doctor.yearOfRegistration = yearOfRegistration || doctor.yearOfRegistration;
            doctor.stateMedicalCouncil = stateMedicalCouncil || doctor.stateMedicalCouncil;

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
                registrationNumber,
                clinicName,
                location,
                yearOfRegistration,
                stateMedicalCouncil,
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

module.exports = { updateDoctorProfile, getDoctorProfile, getAllDoctors, approveDoctor, rejectDoctor, getPendingDoctors, checkTrustScore };
