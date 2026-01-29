import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import axios from 'axios';
import io from 'socket.io-client';

function PatientDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [appointments, setAppointments] = useState([]);
    const [patientProfile, setPatientProfile] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);

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
                const API = import.meta.env.VITE_API_URL;

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
        const newSocket = io(import.meta.env.VITE_API_URL);
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
            await axios.post(`${import.meta.env.VITE_API_URL}/api/patients/profile`, profileFormData, config);
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
            await axios.post(`${import.meta.env.VITE_API_URL}/api/records`, formData, config);
            alert('File Uploaded Successfully');
            setRecordTitle('');
            setUploadFile(null);

            // Refresh records
            const recRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/records/patient/${patientProfile._id}`, { headers: { Authorization: `Bearer ${user.token}` } });
            setMedicalRecords(recRes.data);

        } catch (error) {
            console.error(error);
            alert('Upload failed: ' + (error.response?.data?.message || error.message));
        }
    }


    return (
        <div className="p-8 relative">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Patient Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span>Welcome, {user && user.name}</span>
                    <button
                        onClick={onLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {!patientProfile && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Complete your Profile</p>
                    <p>You need to complete your medical profile before booking appointments.</p>
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="mt-2 bg-yellow-600 text-white px-4 py-1 rounded"
                    >
                        Create Profile
                    </button>
                </div>
            )}

            {/* Live Queue Alert */}
            {alertMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 animate-pulse" role="alert">
                    <p className="font-bold text-lg">{alertMessage}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Actions & Queue */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-xl font-bold mb-4">Actions</h2>
                        <Link to="/find-doctors" className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-2">
                            Find & Book Doctor
                        </Link>
                    </div>

                    <div className="bg-white p-6 rounded shadow">
                        <h2 className="text-xl font-bold mb-4">Live Queue</h2>
                        {liveToken ? (
                            <div className="text-center">
                                <p className="text-gray-500">Current Token</p>
                                <h3 className="text-4xl font-bold text-blue-600">{liveToken.tokenNumber}</h3>
                                <p className="text-sm mt-2">Proceed to consult.</p>
                            </div>
                        ) : (
                            <p>You are not currently in any active queue.</p>
                        )}
                    </div>
                </div>

                {/* Prescriptions */}
                <div className="bg-white p-6 rounded shadow max-h-[80vh] overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">My Prescriptions</h2>
                    {prescriptions.length > 0 ? (
                        <div className="space-y-4">
                            {prescriptions.map((pres) => (
                                <div key={pres._id} className="border p-4 rounded bg-gray-50">
                                    <div className="flex justify-between items-start border-b pb-2 mb-2">
                                        <div>
                                            <p className="font-bold text-lg">{pres.diagnosis}</p>
                                            <p className="text-sm text-gray-500">Dr. {pres.doctor?.user?.name || 'Unknown'}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(pres.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="mb-2">
                                        <ul className="list-disc pl-5 text-sm">
                                            {pres.medicines.map((med, idx) => (
                                                <li key={idx}>
                                                    <span className="font-medium">{med.name}</span> - {med.dosage}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No prescriptions found.</p>
                    )}
                </div>

                {/* Medical Records */}
                <div className="bg-white p-6 rounded shadow max-h-[80vh] overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Medical Records</h2>

                    {/* Upload Form */}
                    <form onSubmit={handleFileUpload} className="mb-6 p-4 border rounded bg-gray-50 text-sm">
                        <h3 className="font-semibold mb-2">Upload New Record</h3>
                        <div className="flex flex-col gap-2">
                            <input type="text" placeholder="Title (e.g., Blood Test)" className="border p-2 rounded" value={recordTitle} onChange={(e) => setRecordTitle(e.target.value)} required />
                            <select className="border p-2 rounded" value={recordType} onChange={(e) => setRecordType(e.target.value)}>
                                <option value="Lab Report">Lab Report</option>
                                <option value="X-Ray">X-Ray</option>
                                <option value="Other">Other</option>
                            </select>
                            <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} accept="image/*,.pdf" className="border p-1 rounded bg-white" required />
                            <button type="submit" className="bg-blue-600 text-white py-1 rounded hover:bg-blue-700">Upload</button>
                        </div>
                    </form>

                    {medicalRecords.length > 0 ? (
                        <div className="space-y-3">
                            {medicalRecords.map((rec) => (
                                <div key={rec._id} className="flex justify-between items-center border p-3 rounded">
                                    <div className="truncate pr-2">
                                        <p className="font-semibold truncate">{rec.title}</p>
                                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-700">{rec.recordType}</span>
                                    </div>
                                    <a href={`${import.meta.env.VITE_API_URL}${rec.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm font-medium whitespace-nowrap">View</a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No records uploaded.</p>
                    )}
                </div>

            </div>

            {/* Profile Creation Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded shadow-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Create Patient Profile</h2>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            {/* ... Profile Form Inputs ... */}
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={profileFormData.dateOfBirth}
                                    onChange={onProfileChange}
                                    required
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Gender</label>
                                <select
                                    name="gender"
                                    value={profileFormData.gender}
                                    onChange={onProfileChange}
                                    className="w-full border p-2 rounded"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Blood Group</label>
                                <input
                                    type="text"
                                    name="bloodGroup"
                                    placeholder="e.g. O+"
                                    value={profileFormData.bloodGroup}
                                    onChange={onProfileChange}
                                    required
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowProfileModal(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Save Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PatientDashboard;
