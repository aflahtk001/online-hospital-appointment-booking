const mongoose = require('mongoose');

const patientSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    bloodGroup: {
        type: String
    },
    allergies: [{
        type: String
    }],
    medicalHistory: [{
        condition: String,
        diagnosisDate: Date,
        status: String // Active, Cured
    }],
    // Address could be here or in User
    address: {
        street: String,
        city: String,
        state: String,
        zip: String
    }
}, {
    timestamps: true
});

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;
