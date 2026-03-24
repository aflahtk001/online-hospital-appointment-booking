import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';
import { useAlert } from '../context/AlertContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function HospitalDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { showAlert } = useAlert();
    const { user } = useSelector((state) => state.auth);

    const [hospital, setHospital] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', specialization: '', experience: '',
        feesPerConsultation: '', timings: '', registrationNumber: '', clinicName: '',
        location: '', yearOfRegistration: '', stateMedicalCouncil: '', dateOfBirth: '', qualifications: ''
    });
    const [certificateFile, setCertificateFile] = useState(null);
    const [doctorCertUrl, setDoctorCertUrl] = useState('');
    const [isUploadingDoctorCert, setIsUploadingDoctorCert] = useState(false);

    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [registerFormData, setRegisterFormData] = useState({
        name: '',
        contactNumber: '',
        registrationNumber: '',
        registrationValidity: '',
        street: '',
        city: '',
        state: '',
        zip: ''
    });
    const [regCert, setRegCert] = useState(null);
    const [accCert, setAccCert] = useState(null);
    const [regCertUrl, setRegCertUrl] = useState('');
    const [accCertUrl, setAccCertUrl] = useState('');
    const [notificationForm, setNotificationForm] = useState({ targetGroup: 'hospital_doctors', message: '' });
    const [isUploadingReg, setIsUploadingReg] = useState(false);
    const [isUploadingAcc, setIsUploadingAcc] = useState(false);

    const [stats, setStats] = useState(null);

    const handleOpenReports = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.get(`${API_URL}/api/hospitals/stats`, config);
            setStats(res.data);
            setShowReportsModal(true);
        } catch (error) {
            console.error(error);
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
            const API = API_URL;

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

    const handleUploadCertificate = async (file, type) => {
        if (!file) return showAlert('Please select a file first', 'warning');
        
        const formData = new FormData();
        formData.append('certificate', file);
        
        try {
            if (type === 'reg') setIsUploadingReg(true);
            else setIsUploadingAcc(true);

            const config = {
                headers: { 
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            const res = await axios.post(`${API_URL}/api/hospitals/upload-certificate`, formData, config);
            
            if (type === 'reg') setRegCertUrl(res.data.url);
            else setAccCertUrl(res.data.url);
            
            showAlert('Certificate Uploaded Successfully!', 'success');
        } catch (error) {
            console.error(error);
            showAlert('Failed to upload certificate', 'error');
        } finally {
            if (type === 'reg') setIsUploadingReg(false);
            else setIsUploadingAcc(false);
        }
    };

    const handleUploadDoctorCertificate = async () => {
        if (!certificateFile) return showAlert('Please select a file first', 'warning');
        
        const formData = new FormData();
        formData.append('certificate', certificateFile);
        
        try {
            setIsUploadingDoctorCert(true);
            const config = {
                headers: { 
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            const res = await axios.post(`${API_URL}/api/hospitals/upload-certificate`, formData, config);
            setDoctorCertUrl(res.data.url);
            showAlert('Doctor Certificate Uploaded Successfully!', 'success');
        } catch (error) {
            console.error(error);
            showAlert('Failed to upload certificate', 'error');
        } finally {
            setIsUploadingDoctorCert(false);
        }
    };

    const handleRegisterHospital = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', registerFormData.name);
            formData.append('contactNumber', registerFormData.contactNumber);
            formData.append('registrationNumber', registerFormData.registrationNumber);
            formData.append('registrationValidity', registerFormData.registrationValidity);
            formData.append('address', JSON.stringify({
                street: registerFormData.street,
                city: registerFormData.city,
                state: registerFormData.state,
                zip: registerFormData.zip
            }));
            formData.append('departments', JSON.stringify([{ name: 'General' }]));
            
            if (regCertUrl) formData.append('registrationCertificate', regCertUrl);
            if (accCertUrl) formData.append('accreditationCertificate', accCertUrl);

            await axios.post(`${API_URL}/api/hospitals`, formData, {
                headers: { 
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            showAlert('Hospital Registered Successfully!', 'success');
            setShowRegisterForm(false);
            fetchHospitalData();
        } catch (error) {
            console.error(error);
            showAlert(error.response?.data?.message || 'Failed to register hospital', 'error');
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post(`${API_URL}/api/notifications/send`, notificationForm, config);
            showAlert(res.data.message, 'success');
            setNotificationForm({ targetGroup: 'hospital_doctors', message: '' });
        } catch (error) {
            console.error(error);
            showAlert(error.response?.data?.message || 'Failed to send notification', 'error');
        }
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { 
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
            };
            const submitData = { ...formData, imrCertificate: doctorCertUrl };

            await axios.post(`${API_URL}/api/hospitals/doctors`, submitData, config);
            showAlert('Doctor Added Successfully', 'success');
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', specialization: '', experience: '', feesPerConsultation: '', registrationNumber: '', clinicName: '', location: '', dateOfBirth: '', qualifications: '', yearOfRegistration: '', stateMedicalCouncil: '', timings: '' });
            setCertificateFile(null);
            setDoctorCertUrl('');
            fetchHospitalData(); // Refresh list
        } catch (error) {
            console.error(error);
            showAlert(error.response?.data?.message || 'Failed to add doctor', 'error');
        }
    };

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (showRegisterForm) {
        return (
            <div className="min-h-screen bg-apple-gray flex items-center justify-center p-4 sm:p-6">
                <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl max-w-2xl w-full">
                    <h1 className="text-3xl font-semibold text-apple-text mb-4">Register Your Hospital</h1>
                    <p className="text-apple-subtext mb-8 text-center sm:text-left">Please provide your facility details to get started.</p>

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">State</label>
                                <select
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    value={registerFormData.state}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, state: e.target.value })}
                                    required
                                >
                                    <option value="">Select State</option>
                                    {[
                                        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
                                        "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
                                        "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
                                        "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
                                        "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
                                        "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
                                        "Lakshadweep", "Puducherry"
                                    ].map(state => <option key={state} value={state}>{state}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Registration Number</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    placeholder="Reg. No"
                                    value={registerFormData.registrationNumber}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, registrationNumber: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Registration Validity</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    value={registerFormData.registrationValidity}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, registrationValidity: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
                                <label className="block text-sm font-semibold text-apple-subtext mb-3 ml-1">Registration Certificate *</label>
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="file"
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-apple-blue file:text-white
                                            hover:file:bg-blue-600 transition-all cursor-pointer bg-white rounded-xl border border-gray-100"
                                        onChange={(e) => setRegCert(e.target.files[0])}
                                        accept=".jpg,.jpeg,.png,.pdf"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleUploadCertificate(regCert, 'reg')}
                                        disabled={!regCert || isUploadingReg}
                                        className={`w-full py-2 rounded-xl font-medium transition-all ${
                                            !regCert || isUploadingReg 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-apple-blue text-white hover:bg-blue-600 shadow-sm'
                                        }`}
                                    >
                                        {isUploadingReg ? 'Uploading...' : 'Upload Registration Cert'}
                                    </button>
                                    {regCertUrl && (
                                        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                                            <span>✅ Uploaded!</span>
                                            <a href={regCertUrl} target="_blank" rel="noopener noreferrer" className="underline ml-auto">View</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-purple-50/30 p-4 rounded-2xl border border-purple-100/50">
                                <label className="block text-sm font-semibold text-apple-subtext mb-3 ml-1">Accreditation (NABH/JCI)</label>
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="file"
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-apple-blue file:text-white
                                            hover:file:bg-blue-600 transition-all cursor-pointer bg-white rounded-xl border border-gray-100"
                                        onChange={(e) => setAccCert(e.target.files[0])}
                                        accept=".jpg,.jpeg,.png,.pdf"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleUploadCertificate(accCert, 'acc')}
                                        disabled={!accCert || isUploadingAcc}
                                        className={`w-full py-2 rounded-xl font-medium transition-all ${
                                            !accCert || isUploadingAcc 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-apple-blue text-white hover:bg-blue-600 shadow-sm'
                                        }`}
                                    >
                                        {isUploadingAcc ? 'Uploading...' : 'Upload Accreditation Cert'}
                                    </button>
                                    {accCertUrl && (
                                        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                                            <span>✅ Uploaded!</span>
                                            <a href={accCertUrl} target="_blank" rel="noopener noreferrer" className="underline ml-auto">View</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="min-h-screen bg-apple-gray flex flex-col">
            {/* Navigation Bar */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-8 py-4 sticky top-0 z-40 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
                    <div className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-apple-text tracking-tight">Hospital Portal</h1>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <NotificationBell />
                        <button
                            onClick={onLogout}
                            className="bg-white text-apple-text border border-gray-200 px-4 py-1.5 sm:px-6 sm:py-2 rounded-full hover:bg-gray-50 font-semibold transition-all shadow-sm hover:shadow-md text-xs sm:text-sm"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-8 relative">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                        <div className="text-left">
                            <h1 className="text-3xl sm:text-4xl font-semibold text-apple-text tracking-tight">Console</h1>
                            <p className="text-apple-subtext text-lg mt-1">Provider Console for {user && user.name}</p>
                        </div>
                    </div>

                {/* Hospital Info Banner */}
                {hospital && (
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">{hospital.name}</h2>
                            <p className="text-blue-100 text-lg flex items-center gap-2">
                                {hospital.address?.city}, {hospital.address?.state}
                                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-inner ${
                                    hospital.status === 'approved' ? 'bg-green-400/30 text-white border border-green-400/50' :
                                    hospital.status === 'rejected' ? 'bg-red-400/30 text-white border border-red-400/50' :
                                    'bg-amber-400/30 text-white border border-amber-400/50'
                                }`}>
                                    {hospital.status}
                                </span>
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
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[500px]">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <h2 className="text-2xl font-semibold text-apple-text">Medical Staff</h2>
                            <button
                                onClick={() => {
                                    if (hospital?.status !== 'approved') {
                                        showAlert('Your hospital must be approved by the Super Admin before you can add doctors.', 'warning');
                                        return;
                                    }
                                    setShowModal(true);
                                }}
                                className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm ${
                                    hospital?.status !== 'approved' 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-apple-blue text-white hover:bg-blue-600'
                                }`}
                                title={hospital?.status !== 'approved' ? 'Approval required to add doctors' : ''}
                            >
                                + Add Doctor
                            </button>
                        </div>

                        {doctors.length > 0 ? (
                            <ul className="space-y-4">
                                {doctors.map(doc => (
                                    <li key={doc._id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-apple-gray/50 rounded-2xl hover:bg-apple-gray transition-colors gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {doc.user?.name?.charAt(0) || 'D'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-apple-text">{doc.user?.name || 'Unknown'}</p>
                                                <p className="text-apple-subtext text-sm">{doc.specialization}</p>
                                            </div>
                                        </div>
                                        <div className="flex w-full sm:w-auto gap-3 items-center mt-3 sm:mt-0">
                                            <button 
                                                onClick={() => setSelectedDoctor(doc)} 
                                                className="flex-1 sm:flex-none px-4 py-1.5 text-apple-blue hover:bg-blue-50 border border-blue-100 rounded-full transition-all flex items-center justify-center font-medium text-sm shadow-sm"
                                            >
                                                View Profile
                                            </button>
                                            <span className={`flex-1 sm:flex-none text-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${doc.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                {doc.status}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <p className="text-apple-subtext text-lg">No doctors assigned yet.</p>
                                <button 
                                    onClick={() => {
                                        if (hospital?.status !== 'approved') {
                                            showAlert('Your hospital must be approved by the Super Admin before you can add doctors.', 'warning');
                                            return;
                                        }
                                        setShowModal(true);
                                    }} 
                                    className={`mt-2 font-medium ${hospital?.status !== 'approved' ? 'text-gray-400 cursor-not-allowed' : 'text-apple-blue hover:underline'}`}
                                >
                                    Add your first doctor
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Queue / Stats Panel */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-semibold mb-4 text-apple-text text-center sm:text-left">Quick Actions</h2>
                            <p className="text-apple-subtext mb-6 text-center sm:text-left">Manage hospital operations and view reports.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={() => navigate('/hospital-queue')} className="p-4 rounded-2xl bg-apple-gray hover:bg-gray-200 transition-colors text-left group flex flex-col items-center sm:items-start">
                                    <span className="block text-2xl mb-2">🏥</span>
                                    <span className="font-semibold text-apple-text group-hover:text-apple-blue">ED/OPD Queue</span>
                                </button>
                                <button onClick={handleOpenReports} className="p-4 rounded-2xl bg-apple-gray hover:bg-gray-200 transition-colors text-left group flex flex-col items-center sm:items-start">
                                    <span className="block text-2xl mb-2">📊</span>
                                    <span className="font-semibold text-apple-text group-hover:text-apple-blue">Reports</span>
                                </button>
                            </div>
                        </div>

                        {/* Send Notification Section */}
                        {hospital && hospital.status === 'approved' && (
                            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 mt-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-xl text-xl">📢</div>
                                    <h2 className="text-xl font-bold text-apple-text">Broadcast Message</h2>
                                </div>
                                <form onSubmit={handleSendNotification} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Send To</label>
                                        <select 
                                            value={notificationForm.targetGroup}
                                            onChange={(e) => setNotificationForm({...notificationForm, targetGroup: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50 text-apple-text font-medium transition-all"
                                        >
                                            <option value="hospital_doctors">All Our Doctors</option>
                                            <option value="hospital_patients">All Our Patients</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Message</label>
                                        <textarea 
                                            value={notificationForm.message}
                                            onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                                            required
                                            rows="3"
                                            placeholder="Type broadcast message..."
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50 text-apple-text text-sm transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <button 
                                        type="submit"
                                        className="w-full bg-apple-blue text-white px-4 py-2.5 rounded-full text-sm font-medium shadow-sm hover:bg-blue-600 transition-all hover:shadow-md"
                                    >
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Doctor Profile View Modal */}
            {selectedDoctor && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar transform transition-all">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm border border-blue-200">
                                    {selectedDoctor.user?.name?.charAt(0) || 'D'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-apple-text">Dr. {selectedDoctor.user?.name || 'Unknown'}</h2>
                                    <p className="text-apple-subtext font-medium">{selectedDoctor.specialization}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDoctor(null)} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors border border-gray-100">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Email</p>
                                    <p className="font-medium text-gray-800 truncate">{selectedDoctor.user?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Registration Number</p>
                                    <p className="font-medium text-gray-800">{selectedDoctor.registrationNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Experience</p>
                                    <p className="font-medium text-gray-800">{selectedDoctor.experience} Years</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Consultation Fee</p>
                                    <p className="font-medium text-gray-800">${selectedDoctor.feesPerConsultation}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Shift Timings</p>
                                    <p className="font-medium text-gray-800">{selectedDoctor.timings || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Clinic Name</p>
                                    <p className="font-medium text-gray-800">{selectedDoctor.clinicName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">State Medical Council</p>
                                    <p className="font-medium text-gray-800 truncate" title={selectedDoctor.stateMedicalCouncil}>{selectedDoctor.stateMedicalCouncil}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Year of Registration</p>
                                    <p className="font-medium text-gray-800">{selectedDoctor.yearOfRegistration}</p>
                                </div>
                            </div>

                            <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-50">
                                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-3">Qualifications</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedDoctor.qualifications && selectedDoctor.qualifications.length > 0 ? (
                                        selectedDoctor.qualifications.map((q, i) => (
                                            <span key={i} className="px-3 py-1 bg-white border border-blue-100 rounded-lg text-sm font-medium text-blue-700 shadow-sm">{q}</span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-500 italic">Not provided</span>
                                    )}
                                </div>
                            </div>
                            
                            {selectedDoctor.imrCertificate && (
                                <div className="bg-green-50/30 p-6 rounded-2xl border border-green-50 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg text-green-700">📜</div>
                                        <div>
                                            <p className="text-sm font-bold text-green-800">IMR Certificate on record</p>
                                            <p className="text-xs text-green-600 font-medium">Verification document attached</p>
                                        </div>
                                    </div>
                                    <a href={selectedDoctor.imrCertificate} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors border border-green-200 whitespace-nowrap">
                                        View Valid Document
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Doctor Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all scale-100">
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
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Doctor Registration Number</label>
                                <input type="text" name="registrationNumber" placeholder="e.g. 12345" value={formData.registrationNumber} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    value={formData.dateOfBirth}
                                    onChange={onChange}
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Clinic Name</label>
                                    <input type="text" name="clinicName" placeholder="Hope Clinic" value={formData.clinicName} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Location</label>
                                    <input type="text" name="location" placeholder="New York, NY" value={formData.location} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Year of Registration</label>
                                    <input type="number" name="yearOfRegistration" placeholder="2015" value={formData.yearOfRegistration} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required min="1950" max={new Date().getFullYear()} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">State Medical Council</label>
                                    <select name="stateMedicalCouncil" value={formData.stateMedicalCouncil} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required>
                                        <option value="">Select Council</option>
                                        {[
                                            "Andhra Pradesh Medical Council", "Arunachal Pradesh Medical Council", "Assam Medical Council",
                                            "Bhopal Medical Council", "Bihar Medical Council", "Bombay Medical Council",
                                            "Chandigarh Medical Council", "Chattisgarh Medical Council", "Delhi Medical Council",
                                            "Goa Medical Council", "Gujarat Medical Council", "Haryana Medical Council",
                                            "Himachal Pradesh Medical Council", "Hyderabad Medical Council", "Jammu & Kashmir Medical Council",
                                            "Jharkhand Medical Council", "Karnataka Medical Council", "Madhya Pradesh Medical Council",
                                            "Madras Medical Council", "Mahakoshal Medical Council", "Maharashtra Medical Council",
                                            "Manipur Medical Council", "Medical Council of India", "Medical Council of Tanganyika",
                                            "Meghalaya Medical Council", "Mizoram Medical Council", "Mysore Medical Council",
                                            "Nagaland Medical Council", "Orissa Council of Medical Registration", "Pondicherry Medical Council",
                                            "Punjab Medical Council", "Rajasthan Medical Council", "Sikkim Medical Council",
                                            "Tamil Nadu Medical Council", "Telangana State Medical Council", "Travancore Cochin Medical Council, Trivandrum",
                                            "Tripura State Medical Council", "Uttar Pradesh Medical Council", "Uttarakhand Medical Council",
                                            "Vidharba Medical Council", "West Bengal Medical Council"
                                        ].map(council => <option key={council} value={council}>{council}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Qualifications (comma separated)</label>
                                <input
                                    type="text"
                                    name="qualifications"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    placeholder="MBBS, MD"
                                    value={formData.qualifications}
                                    onChange={onChange}
                                    required
                                />
                            </div>

                            {/* IMR Certificate Upload */}
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                                <label className="block text-sm font-medium text-apple-subtext mb-2 flex items-center gap-2">
                                    <span className="p-1 bg-blue-100 rounded-md">📜</span>
                                    IMR Certificate Upload
                                </label>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setCertificateFile(e.target.files[0])}
                                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors w-full cursor-pointer"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleUploadDoctorCertificate} 
                                        disabled={isUploadingDoctorCert}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                            isUploadingDoctorCert ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 
                                            doctorCertUrl ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-apple-blue text-white hover:bg-blue-600 shadow-sm'
                                        }`}
                                    >
                                        {isUploadingDoctorCert ? 'Uploading...' : doctorCertUrl ? '✓ Uploaded' : 'Upload File'}
                                    </button>
                                </div>
                                {doctorCertUrl && (
                                    <p className="text-xs text-green-600 mt-2 ml-1 flex items-center gap-1 font-medium">
                                        <span>✓</span> Certificate securely attached to profile
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Consultation Fees ($)</label>
                                <input type="number" name="feesPerConsultation" placeholder="150" value={formData.feesPerConsultation} onChange={onChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50" required min="0" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full">
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
            </main>
        </div>
    );
}

export default HospitalDashboard;
