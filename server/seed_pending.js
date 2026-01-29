const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital');

dotenv.config();
connectDB();

const createPendingData = async () => {
    try {
        // Create Pending Hospital
        const hospital = await Hospital.create({
            name: 'Pending City Clinic',
            address: { street: '456 Side St', city: 'Metropolis', state: 'NY', zip: '10002' },
            contactNumber: '555-9999',
            departments: [{ name: 'Orthopedics' }],
            admins: [], // Simplified
            isApproved: false
        });
        console.log('Pending Hospital Created');

        // Create Pending Doctor User
        const user = await User.create({
            name: 'Dr. Pending',
            email: 'pending_doc@test.com',
            password: 'password123',
            role: 'doctor',
            isApproved: true // User is approved, but doctor profile pending
        });

        // Create Pending Doctor Profile
        await Doctor.create({
            user: user._id,
            specialization: 'Orthopedics',
            qualifications: ['MBBS'],
            experience: 2,
            feesPerConsultation: 100,
            bio: 'Newcomer',
            hospital: hospital._id,
            status: 'pending' // KEY: Pending status
        });
        console.log('Pending Doctor Created');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createPendingData();
