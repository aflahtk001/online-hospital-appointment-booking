import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import axios from 'axios';
import { HiCheck, HiX, HiEye } from 'react-icons/hi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AdminDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [pendingHospitals, setPendingHospitals] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalAppointments: 0 });
    const [selectedItem, setSelectedItem] = useState(null);
    const [detailType, setDetailType] = useState(null);
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [trustScoreData, setTrustScoreData] = useState(null);

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
            const API = API_URL;
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
            await axios.put(`${API_URL}/api/doctors/${id}/approve`, {}, config);
            fetchPendingData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRejectDoctor = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${API_URL}/api/doctors/${id}/reject`, {}, config);
            fetchPendingData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleApproveHospital = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${API_URL}/api/hospitals/${id}/approve`, {}, config);
            fetchPendingData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRejectHospital = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${API_URL}/api/hospitals/${id}/reject`, config);
            fetchPendingData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleCheckTrustScore = async (id) => {
        setVerificationLoading(true);
        setTrustScoreData(null);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post(`${API_URL}/api/doctors/${id}/check-trust-score`, {}, config);
            setTrustScoreData(res.data);
        } catch (error) {
            console.error("Verification failed:", error);
            // Even on error, we might have simulated data from the server or we show 0
            setTrustScoreData({
                status: 'error',
                trust_score: 0,
                registry_data: null,
                comparison_result: { name_match: false, qualification_match: false, council_match: false }
            });
        } finally {
            setVerificationLoading(false);
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
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => { setSelectedItem(doc); setDetailType('doctor'); }} 
                                                className="p-2 text-apple-blue hover:bg-blue-50 rounded-xl transition-all group"
                                                title="View Details"
                                            >
                                                <HiEye className="text-xl" />
                                            </button>
                                            <button 
                                                onClick={() => handleApproveDoctor(doc._id)} 
                                                className="flex items-center gap-1.5 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <HiCheck className="text-lg" />
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleRejectDoctor(doc._id)} 
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Reject"
                                            >
                                                <HiX className="text-xl" />
                                            </button>
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
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => { setSelectedItem(hosp); setDetailType('hospital'); }} 
                                                className="p-2 text-apple-blue hover:bg-blue-50 rounded-xl transition-all"
                                                title="View Details"
                                            >
                                                <HiEye className="text-xl" />
                                            </button>
                                            <button 
                                                onClick={() => handleApproveHospital(hosp._id)} 
                                                className="flex items-center gap-1.5 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <HiCheck className="text-lg" />
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleRejectHospital(hosp._id)} 
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Reject"
                                            >
                                                <HiX className="text-xl" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-apple-subtext italic">No pending hospital approvals.</p>}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-2xl font-bold text-apple-text">
                                {detailType === 'doctor' ? 'Doctor Profile Details' : 'Hospital Facility Details'}
                            </h2>
                            <button onClick={() => { setSelectedItem(null); setTrustScoreData(null); }} className="text-gray-400 hover:text-gray-600 p-2">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            {detailType === 'doctor' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailField label="Full Name" value={selectedItem.user?.name} />
                                    <DetailField label="Email" value={selectedItem.user?.email} />
                                    <DetailField label="Specialization" value={selectedItem.specialization} />
                                    <DetailField label="Experience" value={`${selectedItem.experience} Years`} />
                                    <DetailField label="Consultation Fees" value={`$${selectedItem.feesPerConsultation}`} />
                                    <DetailField label="Timings" value={selectedItem.timings} />
                                    <DetailField label="Registration Number" value={selectedItem.registrationNumber || 'N/A'} />
                                    <DetailField label="Year of Registration" value={selectedItem.yearOfRegistration || 'N/A'} />
                                    <DetailField label="State Medical Council" value={selectedItem.stateMedicalCouncil || 'N/A'} />
                                    <DetailField label="Clinic Name" value={selectedItem.clinicName || 'N/A'} />
                                    <DetailField label="Location" value={selectedItem.location || 'N/A'} />
                                    <div className="col-span-2">
                                        <DetailField label="Bio" value={selectedItem.bio} isLongText />
                                    </div>
                                    <div className="col-span-2">
                                        <DetailField label="Qualifications" value={selectedItem.qualifications?.join(', ')} />
                                    </div>

                                    {/* Verification Section */}
                                    <div className="col-span-2 mt-4 p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-apple-text">Medical Registry Verification</h3>
                                                <p className="text-sm text-apple-subtext">Verification service compares profile data with NMC registry.</p>
                                            </div>
                                            {!trustScoreData && (
                                                <button 
                                                    onClick={() => handleCheckTrustScore(selectedItem._id)}
                                                    disabled={verificationLoading}
                                                    className={`px-6 py-2 rounded-full font-semibold transition-all ${verificationLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-apple-blue text-white hover:bg-blue-600 shadow-md hover:shadow-lg'}`}
                                                >
                                                    {verificationLoading ? 'Checking...' : 'Check Trust Score'}
                                                </button>
                                            )}
                                        </div>

                                        {trustScoreData && (
                                            <div className="space-y-4 animate-in fade-in duration-500">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-black ${trustScoreData.trust_score >= 80 ? 'border-green-500 text-green-600' : trustScoreData.trust_score >= 50 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}`}>
                                                        {trustScoreData.trust_score}%
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                                        <MatchBadge label="Name" match={trustScoreData.comparison_result.name_match} />
                                                        <MatchBadge label="Qualification" match={trustScoreData.comparison_result.qualification_match} />
                                                        <MatchBadge label="Council" match={trustScoreData.comparison_result.council_match} />
                                                    </div>
                                                </div>
                                                
                                                {trustScoreData.registry_data && (
                                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 text-xs">
                                                        <p className="font-bold text-apple-subtext mb-2 uppercase">Official Registry Data Found:</p>
                                                        <p><strong>Name:</strong> {trustScoreData.registry_data.name}</p>
                                                        <p><strong>Qualification:</strong> {trustScoreData.registry_data.qualification}</p>
                                                        <p><strong>Council:</strong> {trustScoreData.registry_data.council}</p>
                                                    </div>
                                                )}

                                                {trustScoreData.status === 'warning' && (
                                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[10px] text-amber-800 flex items-start gap-2">
                                                        <span>⚠️</span>
                                                        <p><strong>Registry Connectivity Issue:</strong> {trustScoreData.message}</p>
                                                    </div>
                                                )}

                                                {trustScoreData.status === 'error' && (
                                                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-[10px] text-red-800 flex items-start gap-2">
                                                        <span>🚫</span>
                                                        <p><strong>Service Unavailable:</strong> Could not connect to the medical registry. Please verify the doctor's documents manually.</p>
                                                    </div>
                                                )}
                                                
                                                <p className={`text-sm font-medium ${trustScoreData.trust_score >= 80 ? 'text-green-600' : 'text-apple-subtext'}`}>
                                                    {trustScoreData.trust_score >= 80 ? '✅ High trust score. This profile appears legitimate.' : '⚠️ Low or medium trust score. Please verify manually before approving.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <DetailField label="Hospital Name" value={selectedItem.name} />
                                        <DetailField label="Contact Number" value={selectedItem.contactNumber} />
                                        <DetailField label="Registration Number" value={selectedItem.registrationNumber || 'N/A'} />
                                        <DetailField label="Registration Validity" value={selectedItem.registrationValidity || 'N/A'} />
                                        <div className="col-span-2">
                                            <DetailField 
                                                label="Address" 
                                                value={`${selectedItem.address?.street}, ${selectedItem.address?.city}, ${selectedItem.address?.state} - ${selectedItem.address?.zip}`} 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-apple-subtext uppercase tracking-wider mb-2">Departments</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.departments?.map((dept, i) => (
                                                <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
                                                    {dept.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t flex justify-end gap-4">
                            <button 
                                onClick={() => {
                                    if(detailType === 'doctor') handleRejectDoctor(selectedItem._id);
                                    else handleRejectHospital(selectedItem._id);
                                    setSelectedItem(null);
                                }}
                                className="px-6 py-2.5 text-red-500 hover:bg-red-50 rounded-full font-medium transition-colors"
                            >
                                Reject Application
                            </button>
                            <button 
                                onClick={() => {
                                    if(detailType === 'doctor') handleApproveDoctor(selectedItem._id);
                                    else handleApproveHospital(selectedItem._id);
                                    setSelectedItem(null);
                                }}
                                className="px-8 py-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 font-medium shadow-md transition-all"
                            >
                                Approve Registration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MatchBadge({ label, match }) {
    return (
        <div className={`flex flex-col items-center p-2 rounded-xl border ${match ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
            <span className="text-[10px] font-black uppercase tracking-tighter mb-1">{label}</span>
            {match ? <HiCheck className="text-xl" /> : <HiX className="text-xl" />}
        </div>
    );
}

function DetailField({ label, value, isLongText }) {
    return (
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-xs font-semibold text-apple-subtext uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-apple-text font-medium ${isLongText ? 'text-sm leading-relaxed' : 'text-base'}`}>
                {value || 'Not provided'}
            </p>
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
