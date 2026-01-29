const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');

// @desc    Upload a new medical record
// @route   POST /api/records
// @access  Private (Patient, Doctor)
const uploadRecord = async (req, res) => {
    try {
        const { title, recordType, description, patientId } = req.body;

        // Determine Patient ID
        // If uploader is patient, use their own profile. If doctor, use patientId from body.
        let targetPatientId = patientId;

        if (req.user.role === 'patient') {
            const profile = await Patient.findOne({ user: req.user.id });
            if (!profile) return res.status(404).json({ message: 'Patient profile not found' });
            targetPatientId = profile._id;
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const record = await MedicalRecord.create({
            patient: targetPatientId,
            uploadedBy: req.user.id,
            title,
            recordType,
            description,
            fileUrl: `/${req.file.path.replace(/\\/g, "/")}` // Normalize path for URL
        });

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get records for a patient
// @route   GET /api/records/patient/:patientId
// @access  Private (Patient, Doctor, Admin)
const getPatientRecords = async (req, res) => {
    try {
        const records = await MedicalRecord.find({ patient: req.params.patientId })
            .sort({ date: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { uploadRecord, getPatientRecords };
