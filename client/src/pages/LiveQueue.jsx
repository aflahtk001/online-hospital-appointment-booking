import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LiveQueue() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'hospital_admin') {
            navigate('/login');
            return;
        }
        fetchQueue();
    }, [user, navigate]);

    const fetchQueue = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/hospital`, config);
            setAppointments(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-apple-gray p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-apple-text">Live Hospital Board</h1>
                        <p className="text-apple-subtext">Real-time status of all departments</p>
                    </div>
                    <button
                        onClick={() => navigate('/hospital-dashboard')}
                        className="bg-white border border-gray-200 px-6 py-2 rounded-full text-apple-text hover:bg-gray-50 transition-colors font-medium shadow-sm"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apple-blue mx-auto mb-4"></div>
                        <p className="text-apple-subtext">Loading live status...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="p-6 font-semibold text-apple-subtext text-sm uppercase tracking-wide">In Queue</th>
                                        <th className="p-6 font-semibold text-apple-subtext text-sm uppercase tracking-wide">Patient</th>
                                        <th className="p-6 font-semibold text-apple-subtext text-sm uppercase tracking-wide">Doctor</th>
                                        <th className="p-6 font-semibold text-apple-subtext text-sm uppercase tracking-wide">Status</th>
                                        <th className="p-6 font-semibold text-apple-subtext text-sm uppercase tracking-wide">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.length > 0 ? (
                                        appointments.map((app) => (
                                            <tr key={app._id} className="border-b border-gray-50 hover:bg-apple-gray/30 transition-colors">
                                                <td className="p-6">
                                                    <span className="text-2xl font-bold text-apple-blue">#{app.token?.number}</span>
                                                </td>
                                                <td className="p-6">
                                                    <p className="font-semibold text-apple-text">{app.patient?.user?.name || 'Unknown'}</p>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                                            {app.doctor?.user?.name?.charAt(0)}
                                                        </div>
                                                        <span className="text-apple-text font-medium">Dr. {app.doctor?.user?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${app.token?.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                                                            app.token?.status === 'active' ? 'bg-green-100 text-green-700' :
                                                                'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {app.token?.status}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-apple-subtext font-medium">
                                                    {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center text-apple-subtext">
                                                <p className="text-xl mb-2">🏁 All Caught Up</p>
                                                <p>No active appointments at the moment.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LiveQueue;
