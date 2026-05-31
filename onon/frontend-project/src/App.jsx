import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Senders from './pages/Senders';
import Receivers from './pages/Receivers';
import Parcels from './pages/Parcels';
import ParcelRecords from './pages/ParcelRecords';
import Payments from './pages/Payments';
import Reports from './pages/Reports';

function AppLayout({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/senders" element={<AppLayout><Senders /></AppLayout>} />
            <Route path="/receivers" element={<AppLayout><Receivers /></AppLayout>} />
            <Route path="/parcels" element={<AppLayout><Parcels /></AppLayout>} />
            <Route path="/parcel-records" element={<AppLayout><ParcelRecords /></AppLayout>} />
            <Route path="/payments" element={<AppLayout><Payments /></AppLayout>} />
            <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
            <Route path="/reports/:module" element={<AppLayout><Reports /></AppLayout>} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
