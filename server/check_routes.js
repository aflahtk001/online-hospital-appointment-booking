const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

function printRoutes(name, router) {
    console.log(`--- ${name} ---`);
    router.stack.forEach(layer => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            console.log(`${methods} ${layer.route.path}`);
        }
    });
}

printRoutes('Doctor Routes', doctorRoutes);
printRoutes('Appointment Routes', appointmentRoutes);
process.exit(0);
