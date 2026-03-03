import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ApplicationForm from './pages/ApplicationForm';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ApplicationForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
