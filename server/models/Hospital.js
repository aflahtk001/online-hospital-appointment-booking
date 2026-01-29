const mongoose = require('mongoose');

const hospitalSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    // The admin user managing this hospital
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    address: {
        street: String,
        city: String,
        state: String,
        zip: String
    },
    contactNumber: {
        type: String,
        required: true
    },
    departments: [{
        name: String,
        headDoctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor'
        }
    }],
    // Doctors associated with this hospital (redundant with Doctor.hospital but good for caching/listing)
    doctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    }],
    isApproved: {
        type: Boolean,
        default: false // Super admin approval needed
    }
}, {
    timestamps: true
});

const Hospital = mongoose.model('Hospital', hospitalSchema);
module.exports = Hospital;
