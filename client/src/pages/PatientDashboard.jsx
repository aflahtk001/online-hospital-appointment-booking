import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function PatientDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [appointments, setAppointments] = useState([]);
    const [patientProfile, setPatientProfile] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);

    // Medical Records State
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [uploadFile, setUploadFile] = useState(null);
    const [recordTitle, setRecordTitle] = useState('');
    const [recordType, setRecordType] = useState('Report');


    // Real-time Queue State
    const [socket, setSocket] = useState(null);
    const [liveToken, setLiveToken] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');

    // Modal State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileFormData, setProfileFormData] = useState({
        dateOfBirth: '',
        gender: 'Male',
        bloodGroup: '',
        contactNumber: ''
    });

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Fetch Patient Profile, Appointments & Prescriptions
        const fetchData = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const API = API_URL;

                // 1. Check Profile
                let profileId = null;
                try {
                    const profileRes = await axios.get(`${API}/api/patients/profile`, config);
                    setPatientProfile(profileRes.data);
                    profileId = profileRes.data._id;
                } catch (err) {
                    console.log('Profile not found, need creation');
                }

                if (profileId) {
                    // 2. Fetch Prescriptions
                    const presRes = await axios.get(`${API}/api/prescriptions/patient/${profileId}`, config);
                    setPrescriptions(presRes.data);

                    // 3. Fetch Medical Records
                    const recRes = await axios.get(`${API}/api/records/patient/${profileId}`, config);
                    setMedicalRecords(recRes.data);
                }

            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, [user, navigate]);

    useEffect(() => {
        if (!user) return;

        // Connect Socket
        const newSocket = io(API_URL);
        setSocket(newSocket);

        // Join patient specific room (using User ID as room for now)
        newSocket.emit('setup', user);

        newSocket.on('connected', () => {
            console.log('Socket Connected');
        });

        // Listen for queue updates
        newSocket.on('patient_called', (data) => {
            if (data.patientName === user.name) {
                setLiveToken(data);
                setAlertMessage(`📢 Your Token ${data.tokenNumber} is being served! Please proceed to Dr. ${data.doctorName || 'the doctor'}.`);
            }
        });

        return () => {
            newSocket.close();
        };
    }, [user]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.post(`${API_URL}/api/patients/profile`, profileFormData, config);
            // Refresh logic needs re-fetching or state update, reload is simple but crude
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Error creating profile');
        }
    };

    const onProfileChange = (e) => {
        setProfileFormData({ ...profileFormData, [e.target.name]: e.target.value });
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', recordTitle);
        formData.append('recordType', recordType);

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                },
            };
            await axios.post(`${API_URL}/api/records`, formData, config);
            alert('File Uploaded Successfully');
            setRecordTitle('');
            setUploadFile(null);

            // Refresh records
            const recRes = await axios.get(`${API_URL}/api/records/patient/${patientProfile._id}`, { headers: { Authorization: `Bearer ${user.token}` } });
            setMedicalRecords(recRes.data);

        } catch (error) {
            console.error(error);
            alert('Upload failed: ' + (error.response?.data?.message || error.message));
        }
    }


    return (
        <div className="min-h-screen bg-apple-gray p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-semibold text-apple-text tracking-tight">Patient Portal</h1>
                        <p className="text-apple-subtext text-lg">Welcome back, {user && user.name}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="bg-white text-apple-text border border-gray-200 px-6 py-2.5 rounded-full hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow-md"
                    >
                        Sign Out
                    </button>
                </div>

                {!patientProfile && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-3xl flex justify-between items-center shadow-sm">
                        <div>
                            <p className="font-bold text-lg mb-1">Complete your Profile</p>
                            <p className="text-yellow-700">You need to complete your medical profile before booking appointments.</p>
                        </div>
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="bg-yellow-500 text-white px-6 py-2 rounded-full font-medium hover:bg-yellow-600 transition-colors shadow-sm"
                        >
                            Create Profile
                        </button>
                    </div>
                )}

                {/* Live Queue Alert */}
                {alertMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-3xl animate-pulse shadow-sm flex items-center gap-4">
                        <span className="text-3xl">📢</span>
                        <p className="font-bold text-lg">{alertMessage}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Actions & Queue (Left Col) */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🩺</div>
                            <h2 className="text-xl font-bold mb-2 text-apple-text">Need a checkup?</h2>
                            <p className="text-apple-subtext mb-6 text-sm">Find specialists and book appointments instantly.</p>
                            <Link to="/find-doctors" className="block w-full text-center bg-apple-blue text-white py-3 rounded-full hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg">
                                Find & Book Doctor
                            </Link>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4 text-apple-text">Live Queue Status</h2>
                            {liveToken ? (
                                <div className="text-center py-4">
                                    <p className="text-apple-subtext text-sm uppercase tracking-wide font-medium">Your Token</p>
                                    <h3 className="text-5xl font-bold text-apple-blue my-2">{liveToken.tokenNumber}</h3>
                                    <p className="text-apple-text font-medium">Proceed to consult.</p>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-gray-300 text-4xl mb-2">🎫</p>
                                    <p className="text-apple-subtext">You are not in any active queue.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <h2 className="text-xl font-bold mb-6 text-apple-text sticky top-0 bg-white pb-2 border-b border-gray-50">My Prescriptions</h2>
                        {prescriptions.length > 0 ? (
                            <div className="space-y-4">
                                {prescriptions.map((pres) => (
                                    <div key={pres._id} className="border border-gray-100 p-5 rounded-2xl bg-apple-gray/30 hover:bg-apple-gray transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-lg text-apple-text">{pres.diagnosis}</p>
                                                <p className="text-sm text-apple-subtext">Dr. {pres.doctor?.user?.name || 'Unknown'}</p>
                                            </div>
                                            <span className="text-xs text-apple-subtext bg-white px-2 py-1 rounded-full border border-gray-200">{new Date(pres.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{pres.medicines.length} Medicines</span>
                                            <button
                                                onClick={() => setSelectedPrescription(pres)}
                                                className="text-apple-blue text-sm font-semibold hover:underline"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-apple-subtext text-center py-8">No prescriptions found.</p>
                        )}
                    </div>

                    {/* Medical Records (Right Col) */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <h2 className="text-xl font-bold mb-6 text-apple-text sticky top-0 bg-white pb-2 border-b border-gray-50">Medical Records</h2>

                        {/* Upload Form */}
                        <form onSubmit={handleFileUpload} className="mb-8 p-5 border border-dashed border-gray-300 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            <h3 className="font-semibold mb-3 text-sm text-apple-text">Upload New Record</h3>
                            <div className="flex flex-col gap-3">
                                <input type="text" placeholder="Record Title (e.g., Blood Test)" className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-white text-sm" value={recordTitle} onChange={(e) => setRecordTitle(e.target.value)} required />
                                <div className="flex gap-2">
                                    <select className="w-1/2 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-white text-sm" value={recordType} onChange={(e) => setRecordType(e.target.value)}>
                                        <option value="Report">Report</option>
                                        <option value="X-Ray">X-Ray</option>
                                        <option value="Prescription">Prescription</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <label className="w-1/2 cursor-pointer bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-apple-subtext hover:text-apple-text hover:border-gray-300 transition-colors text-center truncate">
                                        {uploadFile ? uploadFile.name : 'Choose File'}
                                        <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} accept="image/*,.pdf" className="hidden" required />
                                    </label>
                                </div>
                                <button type="submit" className="w-full bg-apple-text text-white py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">Upload File</button>
                            </div>
                        </form>

                        {medicalRecords.length > 0 ? (
                            <div className="space-y-3">
                                {medicalRecords.map((rec) => (
                                    <div key={rec._id} className="flex justify-between items-center p-3 rounded-xl hover:bg-apple-gray transition-colors group border border-transparent hover:border-gray-200">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="text-2xl flex-shrink-0">📄</span>
                                            <div className="truncate">
                                                <p className="font-medium text-apple-text truncate text-sm">{rec.title}</p>
                                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase tracking-wide">{rec.recordType}</span>
                                            </div>
                                        </div>
                                        <a href={`${API_URL}${rec.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-apple-blue hover:bg-blue-50 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors">View</a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-apple-subtext text-center py-8">No records uploaded.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Creation Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6 text-apple-text">Create Profile</h2>
                        <form onSubmit={handleProfileSubmit} className="space-y-5">
                            <div>
                                <label className="block text-apple-subtext text-sm font-bold mb-1 ml-1">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={profileFormData.dateOfBirth}
                                    onChange={onProfileChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                />
                            </div>
                            <div>
                                <label className="block text-apple-subtext text-sm font-bold mb-1 ml-1">Gender</label>
                                <select
                                    name="gender"
                                    value={profileFormData.gender}
                                    onChange={onProfileChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-apple-subtext text-sm font-bold mb-1 ml-1">Blood Group</label>
                                <input
                                    type="text"
                                    name="bloodGroup"
                                    placeholder="e.g. O+"
                                    value={profileFormData.bloodGroup}
                                    onChange={onProfileChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowProfileModal(false)}
                                    className="bg-gray-100 text-apple-subtext px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-apple-blue text-white px-8 py-3 rounded-full font-medium hover:bg-blue-600 shadow-md transition-all hover:shadow-lg"
                                >
                                    Save Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Prescription Details Modal */}
            {selectedPrescription && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-apple-text">Prescription Details</h2>
                                <p className="text-apple-subtext">Dr. {selectedPrescription.doctor?.user?.name}</p>
                            </div>
                            <button onClick={() => setSelectedPrescription(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2 transition-colors">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-xs text-apple-subtext uppercase tracking-wide font-semibold mb-1">Diagnosis</p>
                                <p className="text-lg font-medium text-apple-text">{selectedPrescription.diagnosis}</p>
                            </div>

                            <div>
                                <p className="text-xs text-apple-subtext uppercase tracking-wide font-semibold mb-3">Medicines</p>
                                <div className="space-y-3">
                                    {selectedPrescription.medicines.map((med, idx) => (
                                        <div key={idx} className="bg-apple-gray/50 p-4 rounded-2xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-apple-text">{med.name}</span>
                                                <span className="text-sm font-semibold text-apple-blue bg-blue-50 px-2 py-0.5 rounded-md">{med.dosage}</span>
                                            </div>
                                            <div className="flex gap-4 text-xs text-gray-500 mb-2">
                                                <span className="flex items-center gap-1">🕒 {med.frequency}</span>
                                                <span className="flex items-center gap-1">📅 {med.duration}</span>
                                            </div>
                                            {med.instructions && (
                                                <p className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-2">"{med.instructions}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedPrescription.notes && (
                                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-yellow-800 text-sm">
                                    <p className="font-semibold mb-1">Doctor's Notes:</p>
                                    <p>{selectedPrescription.notes}</p>
                                </div>
                            )}

                            <div className="text-center pt-2">
                                <p className="text-xs text-gray-400">Prescribed on {new Date(selectedPrescription.date).toLocaleDateString()} at {new Date(selectedPrescription.date).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PatientDashboard;
