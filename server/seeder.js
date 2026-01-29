const mongoose = require('mongoose');
const dotenv = require('dotenv');
// const colors = require('colors'); 
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
    try {
        await User.deleteMany({ email: 'admin@gmail.com' }); // Prevent duplicates

        const superAdmin = {
            name: 'Super Admin',
            email: 'admin@gmail.com',
            password: 'admin@123',
            role: 'super_admin',
            isApproved: true
        };

        const createdAdmin = await User.create(superAdmin);

        // Seed Hospital
        const Hospital = require('./models/Hospital');
        const Doctor = require('./models/Doctor');

        // Clean up
        await Hospital.deleteMany({});
        await Doctor.deleteMany({});

        const hospital = await Hospital.create({
            name: 'General City Hospital',
            address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zip: '10001'
            },
            contactNumber: '555-0199',
            departments: [
                { name: 'Cardiology' },
                { name: 'General' },
                { name: 'Pediatrics' }
            ],
            admins: [createdAdmin._id],
            isApproved: true
        });

        // Seed Doctor User
        await User.deleteMany({ email: 'doctor@seed.com' });
        const doctorUser = await User.create({
            name: 'Dr. John Doe',
            email: 'doctor@seed.com',
            password: 'password123',
            role: 'doctor',
            isApproved: true
        });

        // Seed Doctor Profile
        await Doctor.create({
            user: doctorUser._id,
            specialization: 'Cardiology',
            qualifications: ['MD', 'PhD'],
            experience: 10,
            feesPerConsultation: 150,
            bio: 'Expert Cardiologist with 10 years of experience.',
            hospital: hospital._id,
            status: 'approved',
            timings: {
                "Monday": "09:00-17:00",
                "Tuesday": "09:00-17:00"
            }
        });

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany();
        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
