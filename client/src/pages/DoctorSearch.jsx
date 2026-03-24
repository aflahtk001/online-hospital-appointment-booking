import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

function DoctorSearch() {
    const [doctors, setDoctors] = useState([]);
    const [filters, setFilters] = useState({
        specialization: '',
        minExperience: '',
        maxFees: ''
    });
    const [loading, setLoading] = useState(false);

    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    // Booking State
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [bookLoading, setBookLoading] = useState(false);

    // Load Razorpay script dynamically
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (document.getElementById('razorpay-script')) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.id = 'razorpay-script';
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Fetch doctors on mount and when filters change
    const fetchDoctors = async () => {
        setLoading(true);
        try {
            // Build query string
            const params = new URLSearchParams();
            if (filters.specialization) params.append('specialization', filters.specialization);
            if (filters.minExperience) params.append('minExperience', filters.minExperience);
            if (filters.maxFees) params.append('maxFees', filters.maxFees);

            const res = await axios.get(`${API_URL}/api/doctors?${params.toString()}`);
            setDoctors(res.data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchDoctors();
    };

    const handleBookClick = (doctor) => {
        if (!user) {
            showAlert('Please login to book an appointment', 'warning');
            navigate('/login');
            return;
        }
        // Only patients can book
        if (user.role !== 'patient') {
            showAlert('only patients can book appointments', 'warning');
            return;
        }
        setSelectedDoctor(doctor);
    };

    const confirmBooking = async () => {
        if (!appointmentDate) {
            showAlert('Please select a date', 'warning');
            return;
        }
        setBookLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };
            const hospitalId = selectedDoctor.hospital || '65b4c1e8f23a1c2d3e4f5a6b';

            // 1. Create Razorpay order and pending appointment on backend
            const orderRes = await axios.post(`${API_URL}/api/payments/create-order`, {
                doctorId: selectedDoctor._id,
                hospitalId: hospitalId,
                appointmentDate,
                type: 'visit'
            }, config);

            const { orderId, amount, appointmentId, fee, keyId } = orderRes.data;

            // 2. Load Razorpay checkout script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                showAlert('Failed to load payment gateway. Please check your internet connection.', 'error');
                setBookLoading(false);
                return;
            }

            // 3. Open Razorpay checkout popup
            const options = {
                key: keyId,
                amount: amount,
                currency: 'INR',
                name: 'Hospital Appointment',
                description: `Consultation with Dr. ${selectedDoctor.user?.name}`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        // 4. Verify payment on backend
                        const verifyRes = await axios.post(`${API_URL}/api/payments/verify`, {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            appointmentId: appointmentId
                        }, config);

                        showAlert(`✅ Payment successful! Your token is #${verifyRes.data.token.number} (${verifyRes.data.token.displayToken})`, 'success');
                        setSelectedDoctor(null);
                        setAppointmentDate('');
                    } catch (verifyError) {
                        showAlert('Payment verification failed. Please contact support.', 'error');
                        console.error('Verify error:', verifyError);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email
                },
                theme: { color: '#007aff' },
                modal: {
                    ondismiss: () => {
                        showAlert('Payment was cancelled. Your slot is held for a few minutes.', 'warning');
                        setBookLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
            setBookLoading(false);

        } catch (error) {
            console.error(error);
            showAlert(error.response?.data?.message || 'Booking Failed. Make sure you have a Patient Profile created.', 'error');
            setBookLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-apple-gray p-4 sm:p-8 relative">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                <div className="text-center py-6 sm:py-10">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-apple-text tracking-tight mb-4">Find the perfect specialist.</h1>
                    <p className="text-lg sm:text-xl text-apple-subtext font-light">Book appointments with top-rated doctors near you.</p>
                </div>

                {/* Search Filters */}
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 max-w-5xl mx-auto">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
                            <input
                                type="text"
                                name="specialization"
                                placeholder="Specialization (e.g. Cardiology)"
                                value={filters.specialization}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                            />
                        </div>
                        <input
                            type="number"
                            name="minExperience"
                            placeholder="Min Experience (Years)"
                            value={filters.minExperience}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                        />
                        <input
                            type="number"
                            name="maxFees"
                            placeholder="Max Fees ($)"
                            value={filters.maxFees}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                        />
                        <button type="submit" className="bg-apple-blue text-white px-6 py-3 rounded-2xl font-medium hover:bg-blue-600 transition-all shadow-md hover:shadow-lg">
                            Search Doctors
                        </button>
                    </form>
                </div>

                {/* Results List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="col-span-full text-center text-apple-subtext py-20">Finding the best matches...</p>
                    ) : doctors.length > 0 ? (
                        doctors.map((doctor) => (
                            <div key={doctor._id} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-2xl text-apple-blue font-bold">
                                        {doctor.user?.name?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-apple-text">{doctor.user?.name || 'Doctor'}</h2>
                                        <p className="text-apple-blue font-medium">{doctor.specialization}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-apple-subtext">Experience</span>
                                        <span className="font-medium text-apple-text">{doctor.experience} Years</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-apple-subtext">Consultation Fee</span>
                                        <span className="font-medium text-apple-text">${doctor.feesPerConsultation}</span>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-xs text-apple-subtext uppercase tracking-wide mb-1">Qualifications</p>
                                        <div className="flex flex-wrap gap-2">
                                            {doctor.qualifications.map((q, i) => (
                                                <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs">{q}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleBookClick(doctor)}
                                    className="w-full bg-apple-text text-white py-3 rounded-2xl font-medium hover:bg-gray-900 transition-colors shadow-sm"
                                >
                                    Book Appointment
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-apple-subtext py-20 text-lg">No doctors found matching your criteria.</p>
                    )}
                </div>

                {/* Booking Modal */}
                {selectedDoctor && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-sm w-full transform transition-all scale-100">
                            <h2 className="text-2xl font-bold mb-1 text-apple-text">Book Appointment</h2>
                            <p className="text-apple-subtext mb-5">with Dr. {selectedDoctor.user?.name}</p>

                            {/* Fee Badge */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex justify-between items-center mb-6">
                                <span className="text-sm text-apple-subtext font-medium">Consultation Fee</span>
                                <span className="text-lg font-bold text-apple-blue">₹{selectedDoctor.feesPerConsultation || 200}</span>
                            </div>

                            <div className="mb-6">
                                <label className="block text-apple-subtext text-sm font-bold mb-2 ml-1">Select Date</label>
                                <input
                                    type="date"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mb-4 text-center">You'll be redirected to a secure payment page after selecting a date.</p>
                            <div className="flex flex-col sm:flex-row justify-end gap-3">
                                <button
                                    onClick={() => setSelectedDoctor(null)}
                                    className="w-full sm:w-auto bg-gray-100 text-apple-subtext px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmBooking}
                                    disabled={bookLoading}
                                    className="w-full sm:w-auto bg-apple-blue text-white px-8 py-3 rounded-full font-medium hover:bg-blue-600 shadow-md transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {bookLoading ? 'Processing...' : `Pay ₹${selectedDoctor.feesPerConsultation || 200} & Book`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DoctorSearch;
