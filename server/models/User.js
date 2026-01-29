const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'hospital_admin', 'super_admin'],
        required: true
    },
    isApproved: {
        type: Boolean,
        default: false // Logic handled in controller: patient=true, others=false
    },
    hospitalId: { // For doctors/admins associated with a hospital
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
    }
}, {
    timestamps: true
});

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password pre-save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
