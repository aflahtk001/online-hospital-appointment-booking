const mongoose = require('mongoose');

const prescriptionSchema = mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true }, // e.g., "500mg"
        frequency: { type: String, required: true }, // e.g., "1-0-1" (Morning-Afternoon-Night)
        duration: { type: String, required: true }, // e.g., "5 Days"
        instructions: { type: String } // e.g., "After food"
    }],
    diagnosis: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;
