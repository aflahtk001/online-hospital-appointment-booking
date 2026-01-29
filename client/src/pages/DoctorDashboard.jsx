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

        // Connect to Socket
        const newSocket = io(import.meta.env.VITE_API_URL);
        setSocket(newSocket);

        // Fetch Appointments
        const fetchAppointments = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` }
                };
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/doctor`, config);
                setAppointments(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchAppointments();

        return () => newSocket.close();

    }, [user, navigate]);

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

    return (
        <div className="p-8 relative">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span>Dr. {user && user.name}</span>
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
                    <h2 className="text-xl font-bold mb-4">Today's Schedule</h2>
                    {appointments.length > 0 ? (
                        <ul className="space-y-2">
                            {appointments.map(app => (
                                <li key={app._id} className="border-b pb-2 flex justify-between items-center">
                                    <span>Token {app.token.number} - {app.patient?.user?.name || 'Unknown'}</span>
                                    <span className={`px-2 py-1 rounded text-xs ${app.token.status === 'waiting' ? 'bg-yellow-200' : 'bg-gray-200'}`}>
                                        {app.token.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No appointments for today.</p>
                    )}
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Queue Control</h2>
                    {currentPatient ? (
                        <div className="text-center mb-6 p-4 bg-blue-50 rounded">
                            <p className="text-gray-500">Currently Serving</p>
                            <h3 className="text-4xl font-bold text-blue-600">Token {currentPatient.token.number}</h3>
                            <p className="font-semibold mt-2">{currentPatient.patient?.user?.name}</p>

                            <button
                                onClick={() => setShowPrescriptionModal(true)}
                                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700"
                            >
                                Write Prescription
                            </button>
                        </div>
                    ) : (
                        <p className="text-center mb-6 text-gray-500">Queue is idle</p>
                    )}

                    <div className="mt-4 flex gap-2 justify-center">
                        <button
                            onClick={callNextPatient}
                            className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600"
                        >
                            Call Next
                        </button>
                        <button className="bg-yellow-500 text-white px-4 py-2 rounded font-bold hover:bg-yellow-600">
                            Pause Queue
                        </button>
                    </div>
                </div>
            </div>

            {/* Prescription Modal */}
            {showPrescriptionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Rx - Prescription</h2>
                        <form onSubmit={submitPrescription} className="space-y-4">
                            <div>
                                <label className="font-bold">Diagnosis</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={prescriptionData.diagnosis}
                                    onChange={(e) => setPrescriptionData({ ...prescriptionData, diagnosis: e.target.value })}
                                    placeholder="e.g. Viral Fever"
                                    required
                                />
                            </div>

                            <div>
                                <label className="font-bold mb-2 block">Medicines</label>
                                {prescriptionData.medicines.map((med, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input type="text" placeholder="Drug Name" className="border p-1 w-1/4" value={med.name} onChange={(e) => handlePrescriptionChange(index, 'name', e.target.value)} required />
                                        <input type="text" placeholder="Dosage (500mg)" className="border p-1 w-1/6" value={med.dosage} onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)} required />
                                        <input type="text" placeholder="Freq (1-0-1)" className="border p-1 w-1/6" value={med.frequency} onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)} required />
                                        <input type="text" placeholder="Duration" className="border p-1 w-1/6" value={med.duration} onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)} required />
                                        <input type="text" placeholder="Instructions" className="border p-1 w-1/4" value={med.instructions} onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)} />
                                    </div>
                                ))}
                                <button type="button" onClick={addMedicineField} className="text-blue-500 text-sm hover:underline">+ Add Medicine</button>
                            </div>

                            <div>
                                <label className="font-bold">Notes</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    rows="3"
                                    value={prescriptionData.notes}
                                    onChange={(e) => setPrescriptionData({ ...prescriptionData, notes: e.target.value })}
                                    placeholder="Additional advice..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowPrescriptionModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">Send Prescription</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DoctorDashboard;
