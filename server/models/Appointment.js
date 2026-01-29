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
    // Token details generated after booking
    token: {
        number: Number,
        status: {
            type: String,
            enum: ['waiting', 'serving', 'completed', 'skipped'],
            default: 'waiting'
        }
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
