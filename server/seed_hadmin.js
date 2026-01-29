const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Hospital = require('./models/Hospital');

dotenv.config();
connectDB();

const createHospitalAdmin = async () => {
    try {
        // 1. Create Hospital
        const hospital = await Hospital.create({
            name: 'St. Marys Hospital',
            address: { street: '789 Admin Ave', city: 'Metropolis', state: 'NY', zip: '10003' },
            contactNumber: '555-1111',
            departments: [{ name: 'General' }, { name: 'Neurology' }],
            admins: [],
            isApproved: true
        });
        console.log('Hospital Created');

        // 2. Create Admin User
        const adminUser = await User.create({
            name: 'Hospital Admin',
            email: 'hadmin@test.com',
            password: 'password123',
            role: 'hospital_admin', // key role
            isApproved: true,
            hospitalId: hospital._id
        });
        console.log('Hospital Admin User Created');

        // 3. Link Admin to Hospital
        hospital.admins.push(adminUser._id);
        await hospital.save();

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createHospitalAdmin();
