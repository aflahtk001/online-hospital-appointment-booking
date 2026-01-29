import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import axios from 'axios';

function HospitalDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [hospital, setHospital] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        specialization: '',
        experience: '',
        feesPerConsultation: ''
    });

    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [registerFormData, setRegisterFormData] = useState({
        name: '',
        contactNumber: '',
        street: '',
        city: '',
        state: '',
        zip: ''
    });

    const [stats, setStats] = useState(null);

    const handleOpenReports = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/hospitals/stats`, config);
            setStats(res.data);
            setShowReportsModal(true);
        } catch (error) {
            console.error(error);
            // Open anyway with partial data
            setShowReportsModal(true);
        }
    };

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
    };

    useEffect(() => {
        if (!user || user.role !== 'hospital_admin') {
            navigate('/login');
        } else {
            fetchHospitalData();
        }
    }, [user, navigate]);

    const fetchHospitalData = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const API = import.meta.env.VITE_API_URL;

            // 1. Fetch Hospital Details
            const hospRes = await axios.get(`${API}/api/hospitals/me`, config);
            setHospital(hospRes.data);
            setShowRegisterForm(false);

            // 2. Fetch Doctors
            const docsRes = await axios.get(`${API}/api/hospitals/doctors`, config);
            setDoctors(docsRes.data);

        } catch (error) {
            console.error("Failed to fetch hospital data:", error);
            if (error.response && error.response.status === 404) {
                setShowRegisterForm(true);
            }
        }
    };

    const handleRegisterHospital = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const payload = {
                name: registerFormData.name,
                contactNumber: registerFormData.contactNumber,
                address: {
                    street: registerFormData.street,
                    city: registerFormData.city,
                    state: registerFormData.state,
                    zip: registerFormData.zip
                },
                departments: [{ name: 'General' }] // Default department
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/api/hospitals`, payload, config);
            alert('Hospital Registered Successfully!');
            setShowRegisterForm(false);
            fetchHospitalData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to register hospital');
        }
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            await axios.post(`${import.meta.env.VITE_API_URL}/api/hospitals/doctors`, formData, config);
            alert('Doctor Added Successfully');
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', specialization: '', experience: '', feesPerConsultation: '' });
            fetchHospitalData(); // Refresh list
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to add doctor');
        }
    };

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (showRegisterForm) {
        return (
            <div className="min-h-screen bg-apple-gray flex items-center justify-center p-6">
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-2xl w-full">
                    <h1 className="text-3xl font-semibold text-apple-text mb-4">Register Your Hospital</h1>
                    <p className="text-apple-subtext mb-8">Please provide your facility details to get started.</p>

                    <form onSubmit={handleRegisterHospital} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Hospital Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                placeholder="e.g. City General Hospital"
                                value={registerFormData.name}
                                onChange={(e) => setRegisterFormData({ ...registerFormData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Contact Number</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                placeholder="e.g. +1 555-0123"
                                value={registerFormData.contactNumber}
                                onChange={(e) => setRegisterFormData({ ...registerFormData, contactNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Street</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    placeholder="123 Health St"
                                    value={registerFormData.street}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, street: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">City</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    placeholder="New York"
                                    value={registerFormData.city}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, city: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">State</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    placeholder="NY"
                                    value={registerFormData.state}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, state: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">ZIP Code</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    placeholder="10001"
                                    value={registerFormData.zip}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, zip: e.target.value })}
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-apple-blue text-white py-3.5 rounded-full font-medium hover:bg-blue-600 shadow-lg transition-all">
                            Complete Registration
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-apple-gray p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-semibold text-apple-text tracking-tight">Hospital Portal</h1>
                        <p className="text-apple-subtext text-lg">Admin Console for {user && user.name}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="bg-white text-apple-text border border-gray-200 px-6 py-2.5 rounded-full hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow-md"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Hospital Info Banner */}
                {hospital && (
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-4xl font-bold tracking-tight mb-2">{hospital.name}</h2>
                            <p className="text-blue-100 text-lg flex items-center gap-2">
                                {hospital.address?.city}, {hospital.address?.state}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2">
                                {hospital.departments.map((d, i) => (
                                    <span key={i} className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                                        {d.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Doctors List */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-apple-text">Medical Staff</h2>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-apple-blue text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm"
                            >
                                + Add Doctor
                            </button>
                        </div>

                        {doctors.length > 0 ? (
                            <ul className="space-y-4">
                                {doctors.map(doc => (
                                    <li key={doc._id} className="flex justify-between items-center p-4 bg-apple-gray/50 rounded-2xl hover:bg-apple-gray transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {doc.user?.name?.charAt(0) || 'D'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-apple-text">{doc.user?.name || 'Unknown'}</p>
                                                <p className="text-apple-subtext text-sm">{doc.specialization}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${doc.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {doc.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <p className="text-apple-subtext text-lg">No doctors assigned yet.</p>
                                <button onClick={() => setShowModal(true)} className="text-apple-blue mt-2 font-medium hover:underline">Add your first doctor</button>
                            </div>
                        )}
                    </div>

                    {/* Queue / Stats Panel */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-semibold mb-4 text-apple-text">Quick Actions</h2>
                            <p className="text-apple-subtext mb-6">Manage hospital operations and view reports.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => navigate('/hospital-queue')} className="p-4 rounded-2xl bg-apple-gray hover:bg-gray-200 transition-colors text-left group">
                                    <span className="block text-2xl mb-2">🏥</span>
                                    <span className="font-semibold text-apple-text group-hover:text-apple-blue">ED/OPD Queue</span>
                                </button>
                                <button onClick={handleOpenReports} className="p-4 rounded-2xl bg-apple-gray hover:bg-gray-200 transition-colors text-left group">
                                    <span className="block text-2xl mb-2">📊</span>
                                    <span className="font-semibold text-apple-text group-hover:text-apple-blue">Reports</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Doctor Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-apple-text">Add New Doctor</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleAddDoctor} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Full Name</label>
                                <input type="text" name="name" placeholder="Dr. John Doe" value={formData.name} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Email Address</label>
                                <input type="email" name="email" placeholder="doctor@example.com" value={formData.email} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Password</label>
                                <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Specialization</label>
                                    <input type="text" name="specialization" placeholder="Cardiology" value={formData.specialization} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Experience (Yrs)</label>
                                    <input type="number" name="experience" placeholder="10" value={formData.experience} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required min="0" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Consultation Fees ($)</label>
                                <input type="number" name="feesPerConsultation" placeholder="150" value={formData.feesPerConsultation} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required min="0" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Shift Start</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                        value={formData.timings ? formData.timings.split(' - ')[0] : ''}
                                        onChange={(e) => {
                                            const end = formData.timings ? formData.timings.split(' - ')[1] : '';
                                            setFormData({ ...formData, timings: `${e.target.value} - ${end || ''}` });
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Shift End</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                        value={formData.timings ? formData.timings.split(' - ')[1] : ''}
                                        onChange={(e) => {
                                            const start = formData.timings ? formData.timings.split(' - ')[0] : '';
                                            setFormData({ ...formData, timings: `${start || ''} - ${e.target.value}` });
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-apple-subtext hover:bg-gray-100 rounded-full font-medium transition-colors">Cancel</button>
                                <button type="submit" className="px-8 py-3 bg-apple-blue text-white rounded-full hover:bg-blue-600 font-medium shadow-md transition-all hover:shadow-lg">Create Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Reports Modal */}
            {showReportsModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold text-apple-text">Hospital Analytics</h2>
                            <button onClick={() => setShowReportsModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-apple-text transition-colors">✕</button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex justify-between items-center">
                                <div>
                                    <p className="text-apple-subtext text-sm font-semibold uppercase tracking-wide">Total Doctors</p>
                                    <p className="text-3xl font-bold text-apple-blue">{stats ? stats.totalDoctors : '...'}</p>
                                </div>
                                <span className="text-3xl">👨‍⚕️</span>
                            </div>
                            <div className="p-5 bg-green-50 rounded-2xl border border-green-100 flex justify-between items-center">
                                <div>
                                    <p className="text-apple-subtext text-sm font-semibold uppercase tracking-wide">Patients Today</p>
                                    <p className="text-3xl font-bold text-green-700">{stats ? stats.patientsToday : '...'}</p>
                                </div>
                                <span className="text-3xl">🏥</span>
                            </div>
                            <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 flex justify-between items-center">
                                <div>
                                    <p className="text-apple-subtext text-sm font-semibold uppercase tracking-wide">Revenue (Est.)</p>
                                    <p className="text-3xl font-bold text-purple-700">${stats ? stats.revenue : '...'}</p>
                                </div>
                                <span className="text-3xl">💰</span>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <p className="text-xs text-apple-subtext">Data updated in real-time.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HospitalDashboard;
