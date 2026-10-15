import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/authContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';

// Page Components
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { Doctors } from './pages/Doctors';
import { Appointments } from './pages/Appointments';
import { EMR } from './pages/EMR';
import { Prescriptions } from './pages/Prescriptions';
import { Laboratory } from './pages/Laboratory';
import { BedBoard } from './pages/BedBoard';
import { Pharmacy } from './pages/Pharmacy';
import { Billing } from './pages/Billing';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { PatientPortal } from './pages/PatientPortal';
import { MasterData } from './pages/MasterData';
import { PatientRoom } from './pages/PatientRoom';
import { UserManual } from './pages/UserManual';
import { SweetAlertContainer } from './components/SweetAlert';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-teal-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-slate-400">Loading Clinical Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If patient logs in, restrict to patient portal and user manual only
  const isPatient = user?.roles?.includes('ROLE_PATIENT');
  if (isPatient && location.pathname !== '/portal' && location.pathname !== '/manual') {
    return <Navigate to="/portal" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.roles?.includes('ROLE_PATIENT')) return <Navigate to="/portal" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated Application Routes wrapped in Layout */}
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTIONIST', 'ROLE_LAB_TECHNICIAN', 'ROLE_PHARMACIST', 'ROLE_ACCOUNTANT']}>
                  <Dashboard />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/patients"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTIONIST']}>
                  <Patients />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/doctors"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST']}>
                  <Doctors />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/appointments"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE']}>
                  <Appointments />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/emr"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE']}>
                  <EMR />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/prescriptions"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_PHARMACIST', 'ROLE_NURSE']}>
                  <Prescriptions />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/laboratory"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_LAB_TECHNICIAN', 'ROLE_NURSE']}>
                  <Laboratory />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/pharmacy"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_PHARMACIST', 'ROLE_ACCOUNTANT']}>
                  <Pharmacy />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/bed-board"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTIONIST']}>
                  <BedBoard />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/patient-room/:bedId"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTIONIST']}>
                  <PatientRoom />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/patient-room"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTIONIST']}>
                  <PatientRoom />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/billing"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_ACCOUNTANT']}>
                  <Billing />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/reports"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_ACCOUNTANT', 'ROLE_DOCTOR']}>
                  <Reports />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/audit"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/master-data"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN']}>
                  <MasterData />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/manual"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTIONIST', 'ROLE_LAB_TECHNICIAN', 'ROLE_PHARMACIST', 'ROLE_ACCOUNTANT', 'ROLE_PATIENT']}>
                  <UserManual />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/portal"
            element={
              <AppLayout>
                <ProtectedRoute allowedRoles={['ROLE_PATIENT']}>
                  <PatientPortal />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          {/* Root and Fallback Catch-All */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
        <SweetAlertContainer />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
