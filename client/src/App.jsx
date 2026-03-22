import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import LiveQueue from './pages/LiveQueue';
import AdminDashboard from './pages/AdminDashboard';
import DoctorSearch from './pages/DoctorSearch';
import { Provider } from 'react-redux';
import { store } from './store';
import { AlertProvider } from './context/AlertContext';
import AlertPopup from './components/AlertPopup';

function App() {
  return (
    <Provider store={store}>
      <AlertProvider>
        <AlertPopup />
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Protected Dashboards */}
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
          <Route path="/hospital-queue" element={<LiveQueue />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/find-doctors" element={<DoctorSearch />} />
        </Routes>
      </Router>
      </AlertProvider>
    </Provider>
  );
}

export default App;
