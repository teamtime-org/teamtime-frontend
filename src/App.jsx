import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AppLayout } from '@/components/layout';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import GuestRoute from '@/components/guards/GuestRoute';
import LoginView from '@/views/auth/LoginView';
import DashboardView from '@/views/dashboard/DashboardView';
import AreasView from '@/views/areas/AreasView';
import ProjectsView from '@/views/projects/ProjectsView';
import ProjectDetailView from '@/views/projects/ProjectDetailView';
import { TasksView, TaskDetailView } from '@/views/tasks';
import { TimesheetView } from '@/views/timesheet';
import ReportsView from '@/views/reports/ReportsView';
import UsersView from '@/views/users/UsersView';
import { ROLES } from '@/constants';

function App() {
  return (
    <LanguageProvider>
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
              <Route path="timesheet" element={<TimesheetView />} />
              <Route path="timesheet/:id" element={<TimesheetView />} />
              <Route path="reports" element={<ReportsView />} />
              <Route path="users" element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <UsersView />
                </ProtectedRoute>
              } />
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
    </LanguageProvider>
  );
}

export default App
