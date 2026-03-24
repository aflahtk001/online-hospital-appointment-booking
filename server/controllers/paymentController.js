const Razorpay = require('razorpay');
const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a Razorpay order and a pending appointment
// @route   POST /api/payments/create-order
// @access  Private (Patient)
const createOrder = async (req, res) => {
    const { doctorId, hospitalId, appointmentDate, type } = req.body;

    try {
        // 1. Find patient profile
        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found. Please complete your profile first.' });
        }

        // 2. Find doctor to get fee
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        // Use doctor's fee or a default of 200 (in paise, multiply by 100)
        const fee = doctor.feesPerConsultation || 200;
        const amountInPaise = fee * 100; // Razorpay works in smallest currency unit

        // 3. Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                doctorId: doctorId,
                patientId: patient._id.toString()
            }
        });

        // 4. Calculate queue date
        const queueDate = new Date(appointmentDate).toISOString().split('T')[0];

        // 5. Create a PENDING appointment in DB
        const appointment = await Appointment.create({
            patient: patient._id,
            doctor: doctorId,
            hospital: hospitalId,
            appointmentDate,
            queueDate,
            type: type || 'visit',
            paymentStatus: 'pending',
            razorpayOrderId: razorpayOrder.id,
            amountPaid: fee
        });

        res.status(201).json({
            orderId: razorpayOrder.id,
            amount: amountInPaise,
            currency: 'INR',
            appointmentId: appointment._id,
            doctorName: doctor.user ? doctor.user.name : 'Doctor',
            fee: fee,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Failed to create payment order', error: error.message });
    }
};

// @desc    Verify Razorpay payment signature and confirm appointment
// @route   POST /api/payments/verify
// @access  Private (Patient)
const verifyPayment = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, appointmentId } = req.body;

    try {
        // 1. Cryptographic signature verification
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            // Mark appointment as failed
            await Appointment.findByIdAndUpdate(appointmentId, { paymentStatus: 'failed' });
            return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
        }

        // 2. Get the appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // 3. Generate queue token number (count existing appointments for doctor on same date + 1)
        const existingCount = await Appointment.countDocuments({
            doctor: appointment.doctor,
            queueDate: appointment.queueDate,
            paymentStatus: 'completed',
            _id: { $ne: appointment._id }
        });

        const tokenNumber = existingCount + 1;
        const doctor = await Doctor.findById(appointment.doctor).populate('user', 'name');
        const drPrefix = doctor?.registrationNumber ? `DR${doctor.registrationNumber.slice(-2)}` : 'DR';
        const displayToken = `${drPrefix}-${appointment.queueDate.replace(/-/g, '').slice(4)}-${String(tokenNumber).padStart(3, '0')}`;
        const estimatedTime = tokenNumber * (doctor?.averageConsultationTime || 15);

        // 4. Update appointment with payment details and token
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            {
                paymentStatus: 'completed',
                razorpayPaymentId,
                razorpaySignature,
                'token.number': tokenNumber,
                'token.displayToken': displayToken,
                'token.status': 'waiting',
                'token.estimatedTime': estimatedTime
            },
            { new: true }
        );

        res.status(200).json({
            message: 'Payment verified and appointment confirmed!',
            appointment: updatedAppointment,
            token: {
                number: tokenNumber,
                displayToken: displayToken,
                estimatedTime: estimatedTime
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
};

module.exports = { createOrder, verifyPayment };
