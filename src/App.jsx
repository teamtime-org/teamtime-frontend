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
import { ExcelImportView } from '@/views/projects';
import ExcelImportV2View from '@/views/projects/ExcelImportV2View';
import { TasksView, TaskDetailView } from '@/views/tasks';
import { TimesheetView } from '@/views/timesheet';
import ReportsView from '@/views/reports/ReportsView';
import UsersView from '@/views/users/UsersView';
import SystemConfigView from '@/views/admin/SystemConfigView';
import TimePeriodsView from '@/views/admin/TimePeriodsView';
import AreaFlowsView from '@/views/admin/AreaFlowsView';
import FieldMappingsView from '@/views/admin/FieldMappingsView';
import StagingProjectsView from '@/views/admin/StagingProjectsView';
import ProjectTransfersView from '@/views/admin/ProjectTransfersView';
import DocumentGenerationView from '@/views/admin/DocumentGenerationView';
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
              <Route path="projects/import" element={
                <ProtectedRoute requiredRole={ROLES.ADMINISTRADOR}>
                  <ExcelImportView />
                </ProtectedRoute>
              } />
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
              <Route path="admin/system-config" element={
                <ProtectedRoute requiredRole={ROLES.ADMINISTRADOR}>
                  <SystemConfigView />
                </ProtectedRoute>
              } />
              <Route path="admin/time-periods" element={
                <ProtectedRoute requiredRole={ROLES.ADMINISTRADOR}>
                  <TimePeriodsView />
                </ProtectedRoute>
              } />

              {/* Schema v2 - Rutas de Administración Avanzada */}
              <Route path="admin/area-flows" element={
                <ProtectedRoute requiredRole={ROLES.ADMINISTRADOR}>
                  <AreaFlowsView />
                </ProtectedRoute>
              } />
              <Route path="admin/field-mappings" element={
                <ProtectedRoute requiredRole={ROLES.ADMINISTRADOR}>
                  <FieldMappingsView />
                </ProtectedRoute>
              } />
              <Route path="admin/staging-projects" element={
                <ProtectedRoute requiredRole={ROLES.ADMINISTRADOR}>
                  <StagingProjectsView />
                </ProtectedRoute>
              } />
              <Route path="admin/project-transfers" element={
                <ProtectedRoute requiredRole={[ROLES.ADMINISTRADOR, ROLES.COORDINADOR]}>
                  <ProjectTransfersView />
                </ProtectedRoute>
              } />
              <Route path="admin/document-generation" element={
                <ProtectedRoute requiredRole={[ROLES.ADMINISTRADOR, ROLES.COORDINADOR]}>
                  <DocumentGenerationView />
                </ProtectedRoute>
              } />

              {/* Schema v2 - Importación Mejorada */}
              <Route path="projects/import-v2" element={
                <ProtectedRoute requiredRole={ROLES.ADMINISTRADOR}>
                  <ExcelImportV2View />
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
