import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import axios from 'axios';

function AdminDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [pendingHospitals, setPendingHospitals] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalAppointments: 0 });

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
    };

    useEffect(() => {
        if (!user || user.role !== 'super_admin') {
            navigate('/login');
        } else {
            fetchPendingData();
        }
    }, [user, navigate]);

    const fetchPendingData = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const API = import.meta.env.VITE_API_URL;
            // 1. Fetch Pending Doctors
            const docRes = await axios.get(`${API}/api/doctors/pending`, config);
            setPendingDoctors(docRes.data);

            // 2. Fetch Pending Hospitals
            const hospRes = await axios.get(`${API}/api/hospitals/pending`, config);
            setPendingHospitals(hospRes.data);

            // 3. Fetch System Stats
            const statsRes = await axios.get(`${API}/api/admin/stats`, config);
            setStats(statsRes.data);

        } catch (error) {
            console.error("Failed to fetch pending data:", error);
        }
    };

    const handleApproveDoctor = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/doctors/${id}/approve`, {}, config);
            fetchPendingData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRejectDoctor = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/doctors/${id}/reject`, {}, config);
            fetchPendingData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleApproveHospital = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL}/api/hospitals/${id}/approve`, {}, config);
            fetchPendingData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRejectHospital = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/hospitals/${id}/reject`, config);
            fetchPendingData();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-apple-gray p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-semibold text-apple-text tracking-tight">Dashboard</h1>
                        <p className="text-apple-subtext text-lg">Overview for {user && user.name}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="bg-white text-apple-text border border-gray-200 px-6 py-2.5 rounded-full hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow-md"
                    >
                        Sign Out
                    </button>
                </div>

                {/* System Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Users" value={stats.totalUsers} />
                    <StatCard title="Appointments" value={stats.totalAppointments} />
                    <StatCard title="Active Doctors" value={stats.totalDoctors} />
                    <StatCard title="Hospitals" value={stats.totalHospitals} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pending Doctors */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-semibold mb-6 text-apple-text">Pending Doctors</h2>
                        {pendingDoctors.length > 0 ? (
                            <ul className="space-y-4">
                                {pendingDoctors.map(doc => (
                                    <li key={doc._id} className="flex justify-between items-center p-4 bg-apple-gray/50 rounded-2xl">
                                        <div>
                                            <p className="font-semibold text-apple-text text-lg">{doc.user?.name || 'Unknown'}</p>
                                            <p className="text-apple-subtext text-sm">{doc.specialization}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleApproveDoctor(doc._id)} className="text-white bg-green-500 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-green-600 transition-colors">Approve</button>
                                            <button onClick={() => handleRejectDoctor(doc._id)} className="text-apple-subtext hover:text-red-500 px-3 py-1.5 text-sm font-medium transition-colors">Reject</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-apple-subtext italic">No pending doctor approvals.</p>}
                    </div>

                    {/* Pending Hospitals */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-semibold mb-6 text-apple-text">Pending Hospitals</h2>
                        {pendingHospitals.length > 0 ? (
                            <ul className="space-y-4">
                                {pendingHospitals.map(hosp => (
                                    <li key={hosp._id} className="flex justify-between items-center p-4 bg-apple-gray/50 rounded-2xl">
                                        <div>
                                            <p className="font-semibold text-apple-text text-lg">{hosp.name}</p>
                                            <p className="text-apple-subtext text-sm">Waitlist Application</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleApproveHospital(hosp._id)} className="text-white bg-green-500 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-green-600 transition-colors">Approve</button>
                                            <button onClick={() => handleRejectHospital(hosp._id)} className="text-apple-subtext hover:text-red-500 px-3 py-1.5 text-sm font-medium transition-colors">Reject</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-apple-subtext italic">No pending hospital approvals.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple internal component for stats
function StatCard({ title, value }) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-4xl font-bold text-apple-text tracking-tighter">{value}</span>
            <span className="text-apple-subtext font-medium text-sm uppercase tracking-wide">{title}</span>
        </div>
    );
}

export default AdminDashboard;
