import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

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

    // Booking State
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [bookLoading, setBookLoading] = useState(false);

    // Fetch doctors on mount and when filters change
    const fetchDoctors = async () => {
        setLoading(true);
        try {
            // Build query string
            const params = new URLSearchParams();
            if (filters.specialization) params.append('specialization', filters.specialization);
            if (filters.minExperience) params.append('minExperience', filters.minExperience);
            if (filters.maxFees) params.append('maxFees', filters.maxFees);

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/doctors?${params.toString()}`);
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
            alert('Please login to book an appointment');
            navigate('/login');
            return;
        }
        // Only patients can book
        if (user.role !== 'patient') {
            alert('only patients can book appointments');
            return;
        }
        setSelectedDoctor(doctor);
    };

    const confirmBooking = async () => {
        if (!appointmentDate) {
            alert('Please select a date');
            return;
        }
        setBookLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            // Hardcoding a default hospital for now if doctor doesn't have one linked
            // In real app, doctor.hospital would be populated
            const hospitalId = selectedDoctor.hospital || '65b4c1e8f23a1c2d3e4f5a6b';

            await axios.post(`${import.meta.env.VITE_API_URL}/api/appointments`, {
                doctorId: selectedDoctor._id,
                hospitalId: hospitalId, // Fallback need actual ID from DB later
                appointmentDate,
                type: 'visit'
            }, config);
            alert('Appointment Booked Successfully!');
            setSelectedDoctor(null);
            setAppointmentDate('');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Booking Failed. Make sure you have a Patient Profile created.');
        } finally {
            setBookLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-apple-gray p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-center py-10">
                    <h1 className="text-4xl font-semibold text-apple-text tracking-tight mb-4">Find the perfect specialist.</h1>
                    <p className="text-xl text-apple-subtext font-light">Book appointments with top-rated doctors near you.</p>
                </div>

                {/* Search Filters */}
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 max-w-5xl mx-auto">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="col-span-full text-center text-apple-subtext py-20">Finding the best matches...</p>
                    ) : doctors.length > 0 ? (
                        doctors.map((doctor) => (
                            <div key={doctor._id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
                        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full transform transition-all scale-100">
                            <h2 className="text-2xl font-bold mb-2 text-apple-text">Book Appointment</h2>
                            <p className="text-apple-subtext mb-6">with {selectedDoctor.user?.name}</p>

                            <div className="mb-6">
                                <label className="block text-apple-subtext text-sm font-bold mb-2 ml-1">Select Date</label>
                                <input
                                    type="date"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedDoctor(null)}
                                    className="bg-gray-100 text-apple-subtext px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmBooking}
                                    disabled={bookLoading}
                                    className="bg-apple-blue text-white px-8 py-3 rounded-full font-medium hover:bg-blue-600 shadow-md transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {bookLoading ? 'Booking...' : 'Confirm'}
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
