import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import axios from 'axios';
import { HiCheck, HiX, HiEye } from 'react-icons/hi';
import { useAlert } from '../context/AlertContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AdminDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { showAlert } = useAlert();
    const { user } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('pending');
    const [doctors, setDoctors] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [stats, setStats] = useState({ totalPatients: 0, totalAppointments: 0, totalDoctors: 0, totalHospitals: 0 });
    const [selectedItem, setSelectedItem] = useState(null);
    const [detailType, setDetailType] = useState(null);
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [trustScoreData, setTrustScoreData] = useState(null);
    const [notificationForm, setNotificationForm] = useState({ targetGroup: 'all_hospitals', message: '' });
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
    };

    const chartData = [
        { name: 'Patients', value: stats.totalPatients, color: '#3b82f6' }, // blue-500
        { name: 'Appointments', value: stats.totalAppointments, color: '#a855f7' }, // purple-500
        { name: 'Doctors', value: stats.totalDoctors, color: '#22c55e' }, // green-500
        { name: 'Hospitals', value: stats.totalHospitals, color: '#ef4444' } // red-500
    ];

    useEffect(() => {
        if (!user || user.role !== 'super_admin') {
            navigate('/login');
        } else {
            fetchAllData();
        }
    }, [user, navigate, activeTab, selectedMonth]);

    const fetchAllData = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const API = API_URL;
            
            // 1. Fetch Doctors by Status
            const docRes = await axios.get(`${API}/api/doctors/admin/list?status=${activeTab}`, config);
            setDoctors(docRes.data);

            // 2. Fetch Hospitals by Status
            const hospRes = await axios.get(`${API}/api/hospitals/admin/list?status=${activeTab}`, config);
            setHospitals(hospRes.data);

            // 3. Fetch System Stats
            const statsRes = await axios.get(`${API}/api/admin/stats?month=${selectedMonth}`, config);
            setStats(statsRes.data);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        }
    };

    const handleApproveDoctor = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${API_URL}/api/doctors/${id}/approve`, {}, config);
            fetchAllData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRejectDoctor = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${API_URL}/api/doctors/${id}/reject`, {}, config);
            fetchAllData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleApproveHospital = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${API_URL}/api/hospitals/${id}/approve`, {}, config);
            fetchAllData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRejectHospital = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${API_URL}/api/hospitals/${id}/reject`, {}, config);
            fetchAllData();
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

    const handleSendNotification = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post(`${API_URL}/api/notifications/send`, notificationForm, config);
            showAlert(res.data.message, 'success');
            setNotificationForm({ targetGroup: 'all_hospitals', message: '' });
        } catch (error) {
            console.error(error);
            showAlert(error.response?.data?.message || 'Failed to send notification', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-apple-gray p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-semibold text-apple-text tracking-tight">Dashboard</h1>
                        <p className="text-apple-subtext text-lg">Overview for {user && user.name}</p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                        <button
                            onClick={onLogout}
                            className="bg-white text-apple-text border border-gray-200 px-6 py-2.5 rounded-full hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow-md"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* System Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Patients" value={stats.totalPatients} icon="👥" />
                    <StatCard title="Total Appointments" value={stats.totalAppointments} icon="📅" />
                    <StatCard title="Active Doctors" value={stats.totalDoctors} icon="👨‍⚕️" />
                    <StatCard title="Active Hospitals" value={stats.totalHospitals} icon="🏥" />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Monthly Trends */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl text-2xl">📈</div>
                                <div>
                                    <h2 className="text-xl font-bold text-apple-text">Monthly Overview</h2>
                                    <p className="text-apple-subtext text-sm">Visual breakdown of platform trends</p>
                                </div>
                            </div>
                            <div className="w-full sm:w-auto">
                                <input 
                                    type="month" 
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50 font-medium text-apple-text transition-all"
                                />
                            </div>
                        </div>

                        {stats.dailyStats && stats.dailyStats.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <ChartCard title="Patient Registrations" data={stats.dailyStats} dataKey="patients" color="#3b82f6" />
                                <ChartCard title="Appointments Booked" data={stats.dailyStats} dataKey="appointments" color="#a855f7" />
                                <ChartCard title="Doctors Onboarded" data={stats.dailyStats} dataKey="doctors" color="#22c55e" />
                                <ChartCard title="Hospitals Approved" data={stats.dailyStats} dataKey="hospitals" color="#ef4444" />
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400 italic">No trend data available for this month</div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
                    {['pending', 'approved', 'rejected'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-6 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-apple-blue text-white shadow-md' : 'text-apple-subtext hover:bg-gray-50'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Doctors List */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-semibold mb-6 text-apple-text capitalize">{activeTab} Doctors</h2>
                        {doctors.length > 0 ? (
                            <ul className="space-y-4">
                                {doctors.map(doc => (
                                    <li key={doc._id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-apple-gray/50 rounded-2xl gap-4">
                                        <div className="text-center sm:text-left">
                                            <p className="font-semibold text-apple-text text-lg">{doc.user?.name || 'Unknown'}</p>
                                            <p className="text-apple-subtext text-sm">{doc.specialization}</p>
                                        </div>
                                        <div className="flex w-full sm:w-auto gap-2">
                                            <button 
                                                onClick={() => { setSelectedItem(doc); setDetailType('doctor'); }} 
                                                className="flex-1 sm:flex-none p-2 text-apple-blue hover:bg-blue-50 rounded-xl transition-all group flex items-center justify-center"
                                                title="View Details"
                                            >
                                                <HiEye className="text-xl" />
                                            </button>
                                            {activeTab !== 'approved' && (
                                                <button 
                                                    onClick={() => handleApproveDoctor(doc._id)} 
                                                    className="flex-grow sm:flex-none flex items-center justify-center gap-1.5 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <HiCheck className="text-lg" />
                                                    Approve
                                                </button>
                                            )}
                                            {activeTab !== 'rejected' && (
                                                <button 
                                                    onClick={() => handleRejectDoctor(doc._id)} 
                                                    className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center"
                                                    title="Reject"
                                                >
                                                    <HiX className="text-xl" />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-apple-subtext italic">No {activeTab} doctors found.</p>}
                    </div>

                    {/* Hospitals List */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-semibold mb-6 text-apple-text capitalize">{activeTab} Hospitals</h2>
                        {hospitals.length > 0 ? (
                            <ul className="space-y-4">
                                {hospitals.map(hosp => (
                                    <li key={hosp._id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-apple-gray/50 rounded-2xl gap-4">
                                        <div className="text-center sm:text-left">
                                            <p className="font-semibold text-apple-text text-lg">{hosp.name}</p>
                                            <p className="text-apple-subtext text-sm">{hosp.registrationNumber || 'Registration Pending'}</p>
                                        </div>
                                        <div className="flex w-full sm:w-auto gap-2">
                                            <button 
                                                onClick={() => { setSelectedItem(hosp); setDetailType('hospital'); }} 
                                                className="flex-1 sm:flex-none p-2 text-apple-blue hover:bg-blue-50 rounded-xl transition-all flex items-center justify-center"
                                                title="View Details"
                                            >
                                                <HiEye className="text-xl" />
                                            </button>
                                            {activeTab !== 'approved' && (
                                                <button 
                                                    onClick={() => handleApproveHospital(hosp._id)} 
                                                    className="flex-grow sm:flex-none flex items-center justify-center gap-1.5 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <HiCheck className="text-lg" />
                                                    Approve
                                                </button>
                                            )}
                                            {activeTab !== 'rejected' && (
                                                <button 
                                                    onClick={() => handleRejectHospital(hosp._id)} 
                                                    className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center"
                                                    title="Reject"
                                                >
                                                    <HiX className="text-xl" />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-apple-subtext italic">No {activeTab} hospitals found.</p>}
                    </div>
                </div>

                {/* Send Notification Section */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 mt-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-100 rounded-2xl text-2xl">📢</div>
                        <div>
                            <h2 className="text-xl font-bold text-apple-text">Broadcast Notification</h2>
                            <p className="text-apple-subtext text-sm">Send a message to specific user groups</p>
                        </div>
                    </div>
                    <form onSubmit={handleSendNotification} className="space-y-4 max-w-2xl">
                        <div>
                            <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Send To</label>
                            <select 
                                value={notificationForm.targetGroup}
                                onChange={(e) => setNotificationForm({...notificationForm, targetGroup: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50 text-apple-text font-medium transition-all"
                            >
                                <option value="all_hospitals">All Hospitals</option>
                                <option value="all_doctors">All Doctors</option>
                                <option value="all_patients">All Patients</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Message</label>
                            <textarea 
                                value={notificationForm.message}
                                onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                                required
                                rows="3"
                                placeholder="Type your broadcast message here..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50 text-apple-text transition-all resize-none"
                            ></textarea>
                        </div>
                        <button 
                            type="submit"
                            className="bg-apple-blue text-white px-8 py-3 rounded-full font-medium shadow-md hover:bg-blue-600 transition-all hover:shadow-lg flex items-center gap-2"
                        >
                            <span>Send Broadcast</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                    <div className="col-span-2">
                                        <p className="text-sm font-semibold text-apple-subtext uppercase tracking-wider mb-2">Verification Documents</p>
                                        {selectedItem.imrCertificate ? (
                                            <a 
                                                href={selectedItem.imrCertificate} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-blue-50 text-apple-blue px-5 py-2.5 rounded-2xl font-semibold border border-blue-100 hover:bg-blue-100 transition-all shadow-sm group"
                                            >
                                                <span className="text-xl">📜</span>
                                                <span>View Indian Medical Register (IMR) Certificate</span>
                                                <span className="ml-1 opacity-0 group-hover:opacity-100 transition-all">↗</span>
                                            </a>
                                        ) : (
                                            <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-2xl text-sm italic border border-amber-100">
                                                No IMR Certificate uploaded yet.
                                            </div>
                                        )}
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
                                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                                    <div className={`w-24 h-24 rounded-full border-4 flex-shrink-0 flex items-center justify-center text-3xl font-black ${trustScoreData.trust_score >= 80 ? 'border-green-500 text-green-600' : trustScoreData.trust_score >= 50 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}`}>
                                                        {trustScoreData.trust_score}%
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-3 gap-2 w-full">
                                                        <MatchBadge label="Name" match={trustScoreData.comparison_result.name_match} />
                                                        <MatchBadge label="Qualification" match={trustScoreData.comparison_result.qualification_match} />
                                                        <MatchBadge label="Council" match={trustScoreData.comparison_result.council_match} />
                                                    </div>
                                                </div>
                                                
                                                {trustScoreData.registry_data && (
                                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 text-xs shadow-sm">
                                                        <p className="font-bold text-apple-subtext mb-2 uppercase border-b pb-1">Official Registry Data Found:</p>
                                                        <p className="mb-1"><strong>Name:</strong> {trustScoreData.registry_data.name}</p>
                                                        <p className="mb-1"><strong>Date of Birth:</strong> <span className="text-gray-400 italic font-medium">{trustScoreData.registry_data.dateOfBirth}</span></p>
                                                        <p className="mb-1"><strong>Qualification:</strong> {trustScoreData.registry_data.qualification}</p>
                                                        <p className="mb-1"><strong>Council:</strong> {trustScoreData.registry_data.council}</p>
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                        <div className="col-span-1">
                                            <p className="text-sm font-semibold text-apple-subtext uppercase tracking-wider mb-2">Registration Certificate</p>
                                            {selectedItem.registrationCertificate ? (
                                                <a 
                                                    href={selectedItem.registrationCertificate} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-blue-50 text-apple-blue px-4 py-2 rounded-xl font-semibold border border-blue-100 hover:bg-blue-100 transition-all text-sm"
                                                >
                                                    📜 View Certificate
                                                </a>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Not uploaded</p>
                                            )}
                                        </div>
                                        <div className="col-span-1">
                                            <p className="text-sm font-semibold text-apple-subtext uppercase tracking-wider mb-2">Accreditation Certificate</p>
                                            {selectedItem.accreditationCertificate ? (
                                                <a 
                                                    href={selectedItem.accreditationCertificate} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-semibold border border-purple-100 hover:bg-purple-100 transition-all text-sm"
                                                >
                                                    🏆 View Accreditation
                                                </a>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Not uploaded</p>
                                            )}
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

                        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-end gap-4">
                            <button 
                                onClick={() => {
                                    if(detailType === 'doctor') handleRejectDoctor(selectedItem._id);
                                    else handleRejectHospital(selectedItem._id);
                                    setSelectedItem(null);
                                }}
                                className="w-full sm:w-auto px-6 py-2.5 text-red-500 hover:bg-red-50 rounded-full font-medium transition-colors border border-transparent hover:border-red-100"
                            >
                                Reject Application
                            </button>
                            <button 
                                onClick={() => {
                                    if(detailType === 'doctor') handleApproveDoctor(selectedItem._id);
                                    else handleApproveHospital(selectedItem._id);
                                    setSelectedItem(null);
                                }}
                                className="w-full sm:w-auto px-8 py-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 font-medium shadow-md transition-all"
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
function StatCard({ title, value, icon }) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all hover:border-apple-blue/20">
            <div className="p-4 bg-gray-50 rounded-2xl text-3xl group-hover:scale-110 transition-transform">{icon || '📊'}</div>
            <div className="flex flex-col">
                <span className="text-3xl font-bold text-apple-text tracking-tighter leading-none">{value}</span>
                <span className="text-apple-subtext font-medium text-sm mt-1 uppercase tracking-wide">{title}</span>
            </div>
        </div>
    );
}

function ChartCard({ title, data, dataKey, color }) {
    return (
        <div className="flex flex-col h-[280px]">
            <h3 className="text-sm font-bold text-apple-subtext uppercase tracking-widest mb-4 pl-2">{title}</h3>
            <div className="flex-grow w-full bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="date" 
                            tick={{fill: '#9ca3af', fontSize: 10}} 
                            axisLine={false} 
                            tickLine={false} 
                            minTickGap={20}
                        />
                        <YAxis 
                            tick={{fill: '#9ca3af', fontSize: 10}} 
                            axisLine={false} 
                            tickLine={false} 
                            allowDecimals={false}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                            labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                            itemStyle={{ fontWeight: 'bold', color: color }}
                            formatter={(value) => [value, title]}
                            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || `Day ${label}`}
                        />
                        <Area 
                            type="monotone" 
                            dataKey={dataKey} 
                            stroke={color} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill={`url(#color-${dataKey})`} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default AdminDashboard;
