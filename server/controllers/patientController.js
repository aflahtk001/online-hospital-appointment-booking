const Patient = require('../models/Patient');
const User = require('../models/User');

// @desc    Get current patient profile
// @route   GET /api/patients/profile
// @access  Private (Patient)
const getPatientProfile = async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.id }).populate('user', 'name email');
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create or Update patient profile
// @route   POST /api/patients/profile
// @access  Private (Patient)
const updatePatientProfile = async (req, res) => {
    const { dateOfBirth, gender, bloodGroup, allergies, medicalHistory, address } = req.body;

    try {
        let patient = await Patient.findOne({ user: req.user.id });

        if (patient) {
            // Update
            patient.dateOfBirth = dateOfBirth || patient.dateOfBirth;
            patient.gender = gender || patient.gender;
            patient.bloodGroup = bloodGroup || patient.bloodGroup;
            patient.allergies = allergies || patient.allergies;
            patient.medicalHistory = medicalHistory || patient.medicalHistory;
            patient.address = address || patient.address;

            const updatedPatient = await patient.save();
            res.json(updatedPatient);
        } else {
            // Create
            patient = new Patient({
                user: req.user.id,
                dateOfBirth,
                gender,
                bloodGroup,
                allergies,
                medicalHistory,
                address
            });

            const createdPatient = await patient.save();
            res.json(createdPatient);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPatientProfile, updatePatientProfile };
