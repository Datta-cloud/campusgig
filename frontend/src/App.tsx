import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ExploreGigs from './pages/ExploreGigs';
import OrderWizard from './pages/OrderWizard';
import OrderDetail from './pages/OrderDetail';
import ChatPage from './pages/ChatPage';
import CoursesPage from './pages/CoursesPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminMeetings from './pages/AdminMeetings';
import AdminPricing from './pages/AdminPricing';
import AdminStudents from './pages/AdminStudents';
import AdminReferrals from './pages/AdminReferrals';
import Navbar from './components/Navbar';
import AdminSidebar from './components/AdminSidebar';
import LoadingSpinner from './components/LoadingSpinner';
import AcademicChatbot from './components/AcademicChatbot';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Student trying to access admin pages: redirect to student dashboard
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin trying to access student pages: redirect to admin panel
  if (!adminOnly && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Layout component to handle Student Navbar vs Admin Sidebar
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Landing page has its own full-page hero header
  if (location.pathname === '/') {
    return <>{children}</>;
  }

  // Admin routes render with Admin Sidebar
  if (user?.role === 'admin' && location.pathname.startsWith('/admin')) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    );
  }

  // Standard student/user view renders top Navbar
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
          <Routes>
            {/* Public Landing & Explore */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ExploreGigs />} />
            <Route path="/gigs" element={<ExploreGigs />} />

            {/* Student Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order/new"
              element={
                <ProtectedRoute>
                  <OrderWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order/:id"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:orderId"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/verify/:certId" element={<VerifyCertificatePage />} />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute adminOnly>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/meetings"
              element={
                <ProtectedRoute adminOnly>
                  <AdminMeetings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/chat"
              element={
                <ProtectedRoute adminOnly>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/chat/:orderId"
              element={
                <ProtectedRoute adminOnly>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pricing"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPricing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute adminOnly>
                  <AdminStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/referrals"
              element={
                <ProtectedRoute adminOnly>
                  <AdminReferrals />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AcademicChatbot />
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
