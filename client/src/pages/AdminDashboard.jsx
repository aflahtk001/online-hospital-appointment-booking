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
            setSystemStats(statsRes.data);

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
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span>{user && user.name}</span>
                    <button
                        onClick={onLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>

                    <h3 className="font-semibold mt-4 mb-2">Doctors</h3>
                    {pendingDoctors.length > 0 ? (
                        <ul>
                            {pendingDoctors.map(doc => (
                                <li key={doc._id} className="border-b py-2 flex justify-between items-center">
                                    <span>{doc.user?.name || 'Unknown'} ({doc.specialization})</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDoctorAction(doc._id, 'approve')} className="text-green-500 text-sm hover:underline">Approve</button>
                                        <button onClick={() => handleDoctorAction(doc._id, 'reject')} className="text-red-500 text-sm hover:underline">Reject</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-500 italic">No pending doctors</p>}

                    <h3 className="font-semibold mt-6 mb-2">Hospitals</h3>
                    {pendingHospitals.length > 0 ? (
                        <ul>
                            {pendingHospitals.map(hosp => (
                                <li key={hosp._id} className="border-b py-2 flex justify-between items-center">
                                    <span>{hosp.name}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleHospitalAction(hosp._id, 'approve')} className="text-green-500 text-sm hover:underline">Approve</button>
                                        <button onClick={() => handleHospitalAction(hosp._id, 'reject')} className="text-red-500 text-sm hover:underline">Reject</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-500 italic">No pending hospitals</p>}
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">System Stats</h2>
                    <p>Total Users: {stats.totalUsers}</p>
                    <p>Total Appointments: {stats.totalAppointments}</p>
                    <p>Active Doctors: {stats.totalDoctors}</p>
                    <p>Approved Hospitals: {stats.totalHospitals}</p>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
