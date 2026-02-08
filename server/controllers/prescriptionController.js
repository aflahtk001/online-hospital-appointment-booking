const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @desc    Create new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res) => {
    const { appointmentId, patientId, medicines, diagnosis, notes } = req.body;

    try {
        // Verify Doctor matches User
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const prescription = await Prescription.create({
            appointment: appointmentId,
            doctor: doctor._id,
            patient: patientId,
            medicines,
            diagnosis,
            notes
        });

        // Optionally update appointment status to 'completed'
        await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });

        res.status(201).json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get prescriptions for a patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private (Doctor/Patient/Admin)
const getPatientPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patient: req.params.patientId })
            .populate('doctor')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ date: -1 });
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('doctor')
            .populate('patient')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .populate({
                path: 'patient',
                populate: { path: 'user', select: 'name' }
            });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }
        res.json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Analyze medicines using AI
// @route   POST /api/prescriptions/analyze
// @access  Private (Patient/Doctor)
const analyzeMedicines = async (req, res) => {
    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({ message: 'No medicines provided for analysis' });
    }

    // DEBUG: Check if API key is present
    if (!process.env.GEMINI_API_KEY) {
        console.error('AI Analysis Error: Missing GEMINI_API_KEY env var');
        return res.status(500).json({ message: 'Server configuration error: Missing Gemini API Key. Please add GEMINI_API_KEY to environment variables.' });
    }

    try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Updated to gemini-1.5-flash for better stability
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Analyze the following medicines and provide a structured JSON response.
        For each medicine, provide:
        - "name": Name of the medicine
        - "uses": Common uses (simple language)
        - "sideEffects": Potential side effects (brief)
        - "benefits": Key benefits of taking it
        
        Medicines:
        ${medicines.map(m => `- ${m.name} (${m.dosage})`).join('\n')}

        Return ONLY raw JSON array. No markdown formatting (no \`\`\`json blocks).
        Example format: [{"name": "...", "uses": "...", "sideEffects": "...", "benefits": "..."}]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown code blocks if Gemini includes them
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parse JSON safely
        let analysis;
        try {
            analysis = JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            // Fallback if AI returns valid text but not strict JSON
            analysis = [{ name: "Error", uses: "Could not parse AI response", sideEffects: "", benefits: text }];
        }

        res.json(analysis);

    } catch (error) {
        console.error('AI Analysis Error:', error);
        // RETURN DETAILED ERROR FOR DEBUGGING
        res.status(500).json({ message: `AI Analysis Failed: ${error.message}` });
    }
};

module.exports = { createPrescription, getPatientPrescriptions, getPrescriptionById, analyzeMedicines };
