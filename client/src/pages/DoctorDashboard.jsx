import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import axios from 'axios';
import io from 'socket.io-client';

function DoctorDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [appointments, setAppointments] = useState([]);
    const [currentPatient, setCurrentPatient] = useState(null);
    const [socket, setSocket] = useState(null);

    // Prescription State
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [prescriptionData, setPrescriptionData] = useState({
        medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        diagnosis: '',
        notes: ''
    });

    const [isProfileMissing, setIsProfileMissing] = useState(false);
    const [profileForm, setProfileForm] = useState({
        specialization: '',
        experience: '',
        qualifications: '',
        feesPerConsultation: '',
        bio: '',
        timings: ''
    });

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
    };

    const fetchAppointments = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/doctor`, config);
            setAppointments(res.data);
            setIsProfileMissing(false);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setIsProfileMissing(true);
            } else {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Connect to Socket
        const newSocket = io(import.meta.env.VITE_API_URL);
        setSocket(newSocket);

        fetchAppointments();

        return () => newSocket.close();

    }, [user, navigate]);

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };
            // Qualifications needs to be an array
            const payload = {
                ...profileForm,
                qualifications: profileForm.qualifications.split(',').map(q => q.trim())
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/api/doctors/profile`, payload, config);
            alert('Profile Created Successfully!');
            setIsProfileMissing(false);
            fetchAppointments();
        } catch (error) {
            console.error(error);
            alert('Failed to create profile');
        }
    };

    const callNextPatient = () => {
        const next = appointments.find(app => app.token.status === 'waiting');
        if (next) {
            setCurrentPatient(next);
            // Emit to server to broadcast to particular patient/queue
            socket.emit('call_patient', {
                doctorId: user._id,
                patientId: next.patient._id,
                tokenNumber: next.token.number,
                patientName: next.patient.user.name,
                doctorName: user.name
            });
            alert(`Calling Token ${next.token.number}: ${next.patient?.user?.name || 'Patient'}`);
        } else {
            alert("No patients waiting in queue");
        }
    };

    // Prescription Logic
    const handlePrescriptionChange = (index, field, value) => {
        const newMedicines = [...prescriptionData.medicines];
        newMedicines[index][field] = value;
        setPrescriptionData({ ...prescriptionData, medicines: newMedicines });
    };

    const addMedicineField = () => {
        setPrescriptionData({
            ...prescriptionData,
            medicines: [...prescriptionData.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
        });
    };

    const submitPrescription = async (e) => {
        e.preventDefault();
        // Fallback if patient object structure is different (deep populate or check structure)
        const patId = currentPatient.patient?._id || currentPatient.patient;

        if (!currentPatient) return;

        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const payload = {
                appointmentId: currentPatient._id,
                patientId: patId,
                ...prescriptionData
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/api/prescriptions`, payload, config);
            alert('Prescription Sent Successfully');
            setShowPrescriptionModal(false);
            setPrescriptionData({
                medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
                diagnosis: '',
                notes: ''
            });
        } catch (error) {
            console.error(error);
            alert('Failed to send prescription: ' + (error.response?.data?.message || error.message));
        }
    };

    if (isProfileMissing) {
        return (
            <div className="min-h-screen bg-apple-gray flex items-center justify-center p-6">
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-2xl w-full">
                    <h1 className="text-3xl font-semibold text-apple-text mb-4">Complete Your Profile</h1>
                    <p className="text-apple-subtext mb-8">Please provide your professional details to start accepting appointments.</p>

                    <form onSubmit={handleCreateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Specialization</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    placeholder="e.g. Cardiologist"
                                    value={profileForm.specialization}
                                    onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Experience (Years)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    placeholder="e.g. 5"
                                    value={profileForm.experience}
                                    onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Consultation Fee ($)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                    placeholder="e.g. 100"
                                    value={profileForm.feesPerConsultation}
                                    onChange={(e) => setProfileForm({ ...profileForm, feesPerConsultation: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Timings (Shift Hours)</label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-400 ml-1 mb-1 block">Start Time</label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                            value={profileForm.timings.split(' - ')[0] || ''}
                                            onChange={(e) => {
                                                const end = profileForm.timings.split(' - ')[1] || '';
                                                setProfileForm({ ...profileForm, timings: `${e.target.value} - ${end}` })
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-400 ml-1 mb-1 block">End Time</label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                            value={profileForm.timings.split(' - ')[1] || ''}
                                            onChange={(e) => {
                                                const start = profileForm.timings.split(' - ')[0] || '';
                                                setProfileForm({ ...profileForm, timings: `${start} - ${e.target.value}` })
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Qualifications (comma separated)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                placeholder="MBBS, MD"
                                value={profileForm.qualifications}
                                onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Bio</label>
                            <textarea
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                rows="3"
                                placeholder="Brief description about yourself..."
                                value={profileForm.bio}
                                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                            ></textarea>
                        </div>

                        <button type="submit" className="w-full bg-apple-blue text-white py-3.5 rounded-full font-medium hover:bg-blue-600 shadow-lg transition-all">
                            Create Profile
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-apple-gray p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-semibold text-apple-text tracking-tight">Doctor's Console</h1>
                        <p className="text-apple-subtext text-lg">Welcome, Dr. {user && user.name}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="bg-white text-apple-text border border-gray-200 px-6 py-2.5 rounded-full hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow-md"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Today's Schedule (Left Column) */}
                    <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                        <h2 className="text-xl font-semibold mb-6 text-apple-text">Today's Schedule</h2>
                        {appointments.length > 0 ? (
                            <ul className="space-y-3">
                                {appointments.map(app => (
                                    <li key={app._id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-apple-gray transition-colors border border-transparent hover:border-gray-200">
                                        <div>
                                            <span className="block font-semibold text-apple-text">Token {app.token.number}</span>
                                            <span className="text-sm text-apple-subtext">{app.patient?.user?.name || 'Unknown'}</span>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${app.token.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {app.token.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-apple-subtext text-center py-10">No appointments scheduled for today.</p>
                        )}
                    </div>

                    {/* Queue Control (Right Column - Wider) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Current Patient Interaction Card */}
                        <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 p-32 bg-purple-50/50 rounded-full blur-3xl -ml-16 -mb-16"></div>

                            {currentPatient ? (
                                <div className="relative z-10 space-y-6">
                                    <div>
                                        <p className="text-apple-subtext font-medium uppercase tracking-widest text-sm mb-2">Now Serving</p>
                                        <h3 className="text-6xl font-bold text-apple-blue tracking-tighter mb-2">Token {currentPatient.token.number}</h3>
                                        <p className="text-2xl font-semibold text-apple-text">{currentPatient.patient?.user?.name}</p>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                                        <button
                                            onClick={() => setShowPrescriptionModal(true)}
                                            className="bg-apple-text text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        >
                                            Write Prescription
                                        </button>
                                        <button className="bg-white border-2 border-gray-100 text-apple-text px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-all">
                                            View History
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative z-10 py-10">
                                    <p className="text-2xl text-gray-300 font-semibold mb-4">Queue is Idle</p>
                                    <p className="text-apple-subtext">Click "Call Next" to start seeing patients.</p>
                                </div>
                            )}
                        </div>

                        {/* Queue Actions */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex justify-center gap-4">
                            <button
                                onClick={callNextPatient}
                                className="bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                                <span>📢</span> Call Next Patient
                            </button>
                            <button className="bg-orange-100 text-orange-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-200 transition-all flex items-center gap-2">
                                <span>⏸</span> Pause Queue
                            </button>
                        </div>
                    </div>
                </div>

                {/* Prescription Modal */}
                {showPrescriptionModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-semibold mb-6 text-apple-text">Rx: New Prescription</h2>
                            <form onSubmit={submitPrescription} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Diagnosis</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                        value={prescriptionData.diagnosis}
                                        onChange={(e) => setPrescriptionData({ ...prescriptionData, diagnosis: e.target.value })}
                                        placeholder="e.g. Viral Fever"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-2 ml-1">Medicines</label>
                                    {prescriptionData.medicines.map((med, index) => (
                                        <div key={index} className="flex flex-wrap gap-3 mb-3 p-4 bg-apple-gray rounded-2xl border border-gray-100">
                                            <input type="text" placeholder="Drug Name" className="flex-grow min-w-[150px] p-2 bg-transparent border-b border-gray-300 focus:border-apple-blue focus:outline-none" value={med.name} onChange={(e) => handlePrescriptionChange(index, 'name', e.target.value)} required />
                                            <input type="text" placeholder="Dosage" className="w-24 p-2 bg-transparent border-b border-gray-300 focus:border-apple-blue focus:outline-none" value={med.dosage} onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)} required />
                                            <input type="text" placeholder="Freq (1-0-1)" className="w-24 p-2 bg-transparent border-b border-gray-300 focus:border-apple-blue focus:outline-none" value={med.frequency} onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)} required />
                                            <input type="text" placeholder="Duration" className="w-24 p-2 bg-transparent border-b border-gray-300 focus:border-apple-blue focus:outline-none" value={med.duration} onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)} required />
                                            <input type="text" placeholder="Instructions" className="flex-grow min-w-[150px] p-2 bg-transparent border-b border-gray-300 focus:border-apple-blue focus:outline-none" value={med.instructions} onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)} />
                                        </div>
                                    ))}
                                    <button type="button" onClick={addMedicineField} className="text-apple-blue font-medium mt-2 hover:underline ml-1">+ Add Another Medicine</button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-apple-subtext mb-1 ml-1">Notes</label>
                                    <textarea
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 bg-gray-50/50"
                                        rows="3"
                                        value={prescriptionData.notes}
                                        onChange={(e) => setPrescriptionData({ ...prescriptionData, notes: e.target.value })}
                                        placeholder="Additional advice for the patient..."
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowPrescriptionModal(false)} className="px-6 py-3 text-apple-subtext hover:bg-gray-100 rounded-full font-medium transition-colors">Cancel</button>
                                    <button type="submit" className="px-8 py-3 bg-apple-blue text-white rounded-full hover:bg-blue-600 font-medium shadow-md transition-all hover:shadow-lg">Send Prescription</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DoctorDashboard;
