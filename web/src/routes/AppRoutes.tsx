import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../features/auth/auth';
import LoginPage from '../features/auth/LoginPage';
import PayrollPage from '../features/payroll/PayrollPage';
import type { JSX } from 'react';

function Private({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Private><PayrollPage /></Private>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
