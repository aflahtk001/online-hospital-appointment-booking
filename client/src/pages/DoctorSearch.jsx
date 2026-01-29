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

            await axios.post('http://localhost:5000/api/appointments', {
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
        <div className="p-8 relative">
            <h1 className="text-2xl font-bold mb-6">Find a Doctor</h1>

            {/* Search Filters */}
            <div className="bg-white p-4 rounded shadow mb-8">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        name="specialization"
                        placeholder="Specialization (e.g. Cardiology)"
                        value={filters.specialization}
                        onChange={handleChange}
                        className="border p-2 rounded"
                    />
                    <input
                        type="number"
                        name="minExperience"
                        placeholder="Min Experience (Years)"
                        value={filters.minExperience}
                        onChange={handleChange}
                        className="border p-2 rounded"
                    />
                    <input
                        type="number"
                        name="maxFees"
                        placeholder="Max Fees ($)"
                        value={filters.maxFees}
                        onChange={handleChange}
                        className="border p-2 rounded"
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        Search
                    </button>
                </form>
            </div>

            {/* Results List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    <p>Loading...</p>
                ) : doctors.length > 0 ? (
                    doctors.map((doctor) => (
                        <div key={doctor._id} className="bg-white p-6 rounded shadow border hover:shadow-lg transition">
                            <h2 className="text-xl font-semibold mb-2">{doctor.user?.name || 'Doctor'}</h2>
                            <p className="text-blue-600 mb-2">{doctor.specialization}</p>
                            <div className="text-gray-600 text-sm space-y-1 mb-4">
                                <p>{doctor.experience} Years Exp.</p>
                                <p>${doctor.feesPerConsultation} / Visit</p>
                                <p>{doctor.qualifications.join(', ')}</p>
                            </div>
                            <button
                                onClick={() => handleBookClick(doctor)}
                                className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                            >
                                Book Appointment
                            </button>
                        </div>
                    ))
                ) : (
                    <p>No doctors found matching your criteria.</p>
                )}
            </div>

            {/* Booking Modal */}
            {selectedDoctor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded shadow-lg max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Book w/ {selectedDoctor.user?.name}</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Select Date</label>
                            <input
                                type="date"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                className="w-full border p-2 rounded"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBooking}
                                disabled={bookLoading}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                {bookLoading ? 'Booking...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DoctorSearch;
