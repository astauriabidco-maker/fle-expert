import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BrandProvider } from './contexts/BrandProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';

import ExamSessionPage from './components/ExamSessionPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import OrgAdminDashboard from './components/OrgAdminDashboard';
import RegisterPage from './components/RegisterPage';
import PartnerRegisterPage from './components/PartnerRegisterPage';
import OnboardingPage from './components/OnboardingPage';
import ContentLabPage from './components/ContentLabPage';
import OrgAnalytics from './components/OrgAnalytics';
import HomeRoute from './components/HomeRoute';
import PracticeSessionPage from './components/PracticeSessionPage';
import DiagnosticPage from './components/DiagnosticPage';
import DashboardSelector from './components/DashboardSelector';
import ImpersonationBanner from './components/ImpersonationBanner';

import SalesDashboard from './components/SalesDashboard';
import CoachDashboard from './components/CoachDashboard';
import CandidateDashboard from './components/CandidateDashboard';

function AppRoutes() {
  return (
    <Routes>
      {/* Smart Home Route: Landing Page is always at / */}
      <Route path="/" element={<HomeRoute />} />

      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-partner" element={<PartnerRegisterPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/activate" element={<OnboardingPage />} />

      {/* Protected Routes - General */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardSelector />} />
        <Route path="/exam/session" element={<ExamSessionPage />} />
        <Route path="/learning/practice" element={<PracticeSessionPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
      </Route>

      {/* Shared Content Lab (Admins & Coach) */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_ADMIN', 'COACH']} />}>
        <Route path="/content-lab" element={<ContentLabPage />} />
      </Route>

      {/* 1. Super Admin Space */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
      </Route>

      {/* 2. Admin OF Space */}
      <Route element={<ProtectedRoute allowedRoles={['ORG_ADMIN']} />}>
        <Route path="/of-admin" element={<OrgAdminDashboard />} />
      </Route>

      {/* 3. Sales Space */}
      <Route element={<ProtectedRoute allowedRoles={['SALES']} />}>
        <Route path="/sales" element={<SalesDashboard />} />
      </Route>

      {/* 4. Coach Space */}
      <Route element={<ProtectedRoute allowedRoles={['COACH']} />}>
        <Route path="/coach" element={<CoachDashboard />} />
        <Route path="/analytics" element={<OrgAnalytics />} />
      </Route>

      {/* 5. Candidate App Space */}
      <Route element={<ProtectedRoute allowedRoles={['CANDIDATE']} />}>
        <Route path="/app" element={<CandidateDashboard />} />
      </Route>

      {/* Redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrandProvider>
          <Toaster position="top-right" toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#fff',
              borderRadius: '1rem',
              fontWeight: '600'
            }
          }} />
          <BrowserRouter>
            <ImpersonationBanner />
            <AppRoutes />
          </BrowserRouter>
        </BrandProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
