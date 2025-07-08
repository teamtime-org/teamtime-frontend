import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import GuestRoute from '@/components/guards/GuestRoute';
import LoginView from '@/views/auth/LoginView';
import DashboardView from '@/views/dashboard/DashboardView';
import AreasView from '@/views/areas/AreasView';
import ProjectsView from '@/views/projects/ProjectsView';
import ProjectDetailView from '@/views/projects/ProjectDetailView';
import { TasksView, TaskDetailView } from '@/views/tasks';
import { ROLES } from '@/constants';

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
            <Route path="projects" element={<ProjectsView />} />
            <Route path="projects/:id" element={<ProjectDetailView />} />
            <Route path="tasks" element={<TasksView />} />
            <Route path="tasks/:id" element={<TaskDetailView />} />
            <Route path="timesheet" element={<div>Timesheet View - Coming Soon</div>} />
            <Route path="reports" element={<div>Reports View - Coming Soon</div>} />
            <Route path="users" element={<div>Users View - Coming Soon</div>} />
            <Route path="areas" element={
              <ProtectedRoute requiredRole={ROLES.ADMIN}>
                <AreasView />
              </ProtectedRoute>
            } />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
