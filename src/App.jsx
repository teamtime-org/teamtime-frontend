import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import GuestRoute from '@/components/guards/GuestRoute';
import LoginView from '@/views/auth/LoginView';
import DashboardView from '@/views/dashboard/DashboardView';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            <GuestRoute>
              <LoginView />
            </GuestRoute>
          } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardView />} />
            <Route path="projects" element={<div>Projects View - Coming Soon</div>} />
            <Route path="tasks" element={<div>Tasks View - Coming Soon</div>} />
            <Route path="timesheet" element={<div>Timesheet View - Coming Soon</div>} />
            <Route path="reports" element={<div>Reports View - Coming Soon</div>} />
            <Route path="users" element={<div>Users View - Coming Soon</div>} />
            <Route path="areas" element={<div>Areas View - Coming Soon</div>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
