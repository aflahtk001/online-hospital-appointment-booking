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
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        specialization: '',
        experience: '',
        feesPerConsultation: ''
    });

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

            // 2. Fetch Doctors
            const docsRes = await axios.get(`${API}/api/hospitals/doctors`, config);
            setDoctors(docsRes.data);

        } catch (error) {
            console.error("Failed to fetch hospital data:", error);
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

    return (
        <div className="p-8 relative">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Hospital Admin Panel</h1>
                <div className="flex items-center gap-4">
                    <span>Admin: {user && user.name}</span>
                    <button
                        onClick={onLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Hospital Info Banner */}
            {hospital && (
                <div className="bg-blue-600 text-white p-6 rounded shadow mb-8">
                    <h2 className="text-3xl font-bold">{hospital.name}</h2>
                    <p>{hospital.address?.city}, {hospital.address?.state}</p>
                    <p className="text-sm mt-2">Departments: {hospital.departments.map(d => d.name).join(', ')}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Manage Doctors</h2>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                            Add New Doctor
                        </button>
                    </div>

                    {doctors.length > 0 ? (
                        <ul className="space-y-3">
                            {doctors.map(doc => (
                                <li key={doc._id} className="border p-3 rounded flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{doc.user?.name || 'Unknown'}</p>
                                        <p className="text-sm text-gray-500">{doc.specialization}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${doc.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {doc.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 italic">No doctors assigned yet.</p>
                    )}
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Reception Queue</h2>
                    <p className="text-gray-600 mb-4">Manage the general OPD queue for the hospital.</p>
                    <button className="text-blue-500 hover:underline">Open Queue Panel</button>
                </div>
            </div>

            {/* Add Doctor Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Add New Doctor</h2>
                        <form onSubmit={handleAddDoctor} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" name="name" placeholder="Dr. John Doe" value={formData.name} onChange={onChange} className="w-full border p-2 rounded mt-1" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input type="email" name="email" placeholder="doctor@example.com" value={formData.email} onChange={onChange} className="w-full border p-2 rounded mt-1" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input type="password" name="password" placeholder="********" value={formData.password} onChange={onChange} className="w-full border p-2 rounded mt-1" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                                <input type="text" name="specialization" placeholder="e.g. Cardiology" value={formData.specialization} onChange={onChange} className="w-full border p-2 rounded mt-1" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Experience</label>
                                    <input type="number" name="experience" placeholder="Years" value={formData.experience} onChange={onChange} className="w-full border p-2 rounded mt-1" required min="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Fees ($)</label>
                                    <input type="number" name="feesPerConsultation" placeholder="Amount" value={formData.feesPerConsultation} onChange={onChange} className="w-full border p-2 rounded mt-1" required min="0" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">Add Doctor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HospitalDashboard;
