const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    queueDate: {
        type: String, // YYYY-MM-DD (Exact Date String)
        required: true
    },
    // Token details generated after booking
    token: {
        number: Number, // Daily Sequence Number (1, 2, 3...)
        displayToken: String, // Format: DRX-DD-XXX
        status: {
            type: String,
            enum: ['waiting', 'serving', 'completed', 'skipped'],
            default: 'waiting'
        },
        estimatedTime: Number
    },
    type: {
        type: String,
        enum: ['visit', 'video'],
        default: 'visit'
    },
    notes: String
}, {
    timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
