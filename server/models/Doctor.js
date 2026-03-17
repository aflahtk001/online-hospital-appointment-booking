const mongoose = require('mongoose');

const doctorSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    specialization: {
        type: String
    },
    qualifications: {
        type: [String]
    },
    experience: {
        type: Number // Years
    },
    feesPerConsultation: {
        type: Number
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
    },
    registrationNumber: {
        type: String
    },
    clinicName: {
        type: String
    },
    location: {
        type: String
    },
    yearOfRegistration: {
        type: Number
    },
    stateMedicalCouncil: {
        type: String
    },
    dateOfBirth: {
        type: Date
    },
    imrCertificate: {
        type: String // Cloudinary URL
    }
}, {
    timestamps: true
});

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
