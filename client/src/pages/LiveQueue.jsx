import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
        
        // Initial fetch
        fetchQueue();

        // Setup polling every 10 seconds
        const interval = setInterval(fetchQueue, 10000);

        return () => clearInterval(interval); // Cleanup on unmount
    }, [user, navigate]);

    const fetchQueue = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };
            const res = await axios.get(`${API_URL}/api/appointments/hospital`, config);
            setAppointments(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Queue Fetch Error:", error);
            // Don't set loading to false if it's a background poll
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
                                        // Group appointments by doctor
                                        Object.values(appointments.reduce((acc, app) => {
                                            const docId = app.doctor?._id;
                                            if (!acc[docId]) acc[docId] = { doctor: app.doctor, apps: [] };
                                            acc[docId].apps.push(app);
                                            return acc;
                                        }, {})).map((group, gIdx) => (
                                            <React.Fragment key={group.doctor?._id || gIdx}>
                                                {/* Doctor Header Row */}
                                                <tr className="bg-apple-blue/5 border-l-4 border-apple-blue">
                                                    <td colSpan="5" className="p-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-apple-blue text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                                                {group.doctor?.user?.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-apple-text">Dr. {group.doctor?.user?.name}</p>
                                                                <p className="text-[10px] text-apple-subtext uppercase tracking-widest font-bold">{group.doctor?.specialization}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Patient Rows */}
                                                {group.apps.map((app) => (
                                                    <tr key={app._id} className="border-b border-gray-50 hover:bg-apple-gray/30 transition-colors">
                                                        <td className="p-6 pl-10">
                                                            <div className="flex flex-col">
                                                                <span className="text-2xl font-black text-apple-blue tracking-tighter leading-none">#{app.token?.displayToken || app.token?.number}</span>
                                                                <span className="text-[10px] text-apple-subtext font-bold uppercase mt-1">Token Number</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <p className="font-bold text-apple-text">{app.patient?.user?.name || 'Anonymous'}</p>
                                                            <p className="text-[10px] text-apple-subtext font-medium">Patient</p>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-apple-text font-bold">OPD {app.doctor?.clinicName || 'General'}</span>
                                                                <span className="text-[10px] text-apple-subtext font-bold uppercase">Department</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                                                                app.token?.status === 'waiting' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                app.token?.status === 'serving' ? 'bg-green-500 text-white border-green-600 animate-pulse' :
                                                                app.token?.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-gray-50 text-gray-500 border-gray-200'
                                                                }`}>
                                                                {app.token?.status === 'serving' ? '● Serving Now' : app.token?.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-6 text-apple-subtext font-bold text-sm">
                                                            {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
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
