try {
    console.log('Testing authRoutes...');
    require('./routes/authRoutes');
    console.log('Testing patientRoutes...');
    require('./routes/patientRoutes');
    console.log('Testing doctorRoutes...');
    require('./routes/doctorRoutes');
    console.log('Testing hospitalRoutes...');
    require('./routes/hospitalRoutes');
    console.log('Testing appointmentRoutes...');
    require('./routes/appointmentRoutes');
    console.log('All routes loaded successfully!');
} catch (error) {
    console.error('Error during route loading:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
}
