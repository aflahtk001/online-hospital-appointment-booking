const mongoose = require('mongoose');

const doctorSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    qualifications: {
        type: [String],
        required: true
    },
    experience: {
        type: Number, // Years
        required: true
    },
    feesPerConsultation: {
        type: Number,
        required: true
    },
    bio: {
        type: String
    },
    // Availability Schedule (Simple structure for now)
    // Availability Schedule
    timings: {
        type: String, // e.g. "Mon-Fri: 09:00-17:00"
        required: false
    },
    averageConsultationTime: {
        type: Number, // Minutes
        default: 15
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
    }
}, {
    timestamps: true
});

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
