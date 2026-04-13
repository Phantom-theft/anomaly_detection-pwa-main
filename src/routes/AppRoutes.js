import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";

// Utilities
import { ToastContainer } from "react-toastify";
import useAuth from "../hooks/useAuth";
import ErrorBoundary from "../components/ErrorBoundary";
import LoadingSpinner, { PageLoader } from "../components/LoadingSpinner";

/* =====================
    LAZY LOADED PAGES
    Using React.lazy() for code splitting
===================== */

// Auth Pages
const LoginForm = lazy(() => import("../form/_LoginForm"));
const AdminRegisterForm = lazy(() => import("../form/_AdminRegisterForm"));
const AdminRegisterGate = lazy(() => import("../form/AdminRegisterGate"));

// Main Dashboard Pages
const Dashboard = lazy(() => import("../pages/_Dashboard"));
const Camera = lazy(() => import("../pages/_Camera"));
const Alert = lazy(() => import("../pages/_Alert"));
const Settings = lazy(() => import("../pages/_Settings"));

// Admin Pages
const SystemUsers = lazy(() => import("../pages/admin/_SystemUsers"));
const CameraAdmin = lazy(() => import("../pages/admin/_CameraAdmin"));
const AdminDashboard = lazy(() => import("../pages/admin/_AdminDashboard"));
const DetectionSettings = lazy(() => import("../pages/admin/_DetectionSettings"));

// SuperAdmin Pages
const SuperAdminDashboard = lazy(() => import("../pages/superadmin/_SuperAdminDashboard"));
const SuperAdminUsers = lazy(() => import("../pages/superadmin/_SuperAdminUsers"));
const Organizations = lazy(() => import("../pages/superadmin/Organizations"));
const SystemSetting = lazy(() => import("../pages/superadmin/_SystemSetting"));

/* =====================
    ROUTE GUARDS
===================== */

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ user, role, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;
  return children;
};

const SuperAdminRoute = ({ user, role, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "superadmin") return <Navigate to="/" replace />;
  return children;
};

/* =====================
    AUTH LOADER
===================== */

const AuthLoader = ({ loading, children }) => {
  if (loading) {
    return <PageLoader message="Checking authentication..." />;
  }
  return children;
};

/* =====================
    ERROR BOUNDARY WRAPPER
===================== */

const RouteErrorBoundary = ({ children, fallbackMessage }) => {
  return (
    <ErrorBoundary
      title="Page Error"
      message={fallbackMessage || "An error occurred while loading this page"}
    >
      {children}
    </ErrorBoundary>
  );
};

/* =====================
    MAIN ROUTER
===================== */

const AppRoutes = () => {
  const { user, role, loading } = useAuth();

  return (
    <div>
      <AuthLoader loading={loading}>
        <Routes>

          {/* ── PUBLIC ROUTES ── */}
          <Route 
            path="/login" 
            element={
              <RouteErrorBoundary fallbackMessage="Unable to load login page">
                <Suspense fallback={<PageLoader />}>
                  {!user ? <AuthLayout><LoginForm /></AuthLayout> : <Navigate to="/" replace />}
                </Suspense>
              </RouteErrorBoundary>
            } 
          />

          <Route 
            path="/admin-register-gate" 
            element={
              <RouteErrorBoundary fallbackMessage="Unable to load registration page">
                <Suspense fallback={<PageLoader />}>
                  {!user ? <AdminRegisterGate /> : <Navigate to="/" replace />}
                </Suspense>
              </RouteErrorBoundary>
            } 
          />

          <Route 
            path="/admin-register" 
            element={
              <RouteErrorBoundary fallbackMessage="Unable to load admin registration">
                <Suspense fallback={<PageLoader />}>
                  {!user
                    ? <div className="flex w-full h-screen items-center justify-center bg-gray-100 p-4"><AdminRegisterForm /></div>
                    : <Navigate to="/" replace />}
                </Suspense>
              </RouteErrorBoundary>
            } 
          />

          {/* ── PROTECTED ROUTES ── */}
          <Route element={<ProtectedRoute user={user}><MainLayout /></ProtectedRoute>}>

            {/* DYNAMIC ROOT PATH */}
            <Route 
              path="/" 
              element={
                <RouteErrorBoundary fallbackMessage="Unable to load dashboard">
                  <Suspense fallback={<PageLoader message="Loading dashboard..." />}>
                    {role === "superadmin" ? <SuperAdminDashboard /> :
                      role === "admin" ? <AdminDashboard /> :
                        <Dashboard />}
                  </Suspense>
                </RouteErrorBoundary>
              } 
            />

            {/* All roles - Alerts */}
            <Route 
              path="/alert" 
              element={
                <RouteErrorBoundary fallbackMessage="Unable to load alerts">
                  <Suspense fallback={<PageLoader message="Loading alerts..." />}>
                    <Alert />
                  </Suspense>
                </RouteErrorBoundary>
              } 
            />

            {/* All roles - Settings */}
            <Route 
              path="/settings" 
              element={
                <RouteErrorBoundary fallbackMessage="Unable to load settings">
                  <Suspense fallback={<PageLoader message="Loading settings..." />}>
                    <Settings />
                  </Suspense>
                </RouteErrorBoundary>
              } 
            />

            {/* User only - Camera View */}
            <Route 
              path="/camera" 
              element={
                <RouteErrorBoundary fallbackMessage="Unable to load camera view">
                  <Suspense fallback={<PageLoader message="Loading camera..." />}>
                    <Camera />
                  </Suspense>
                </RouteErrorBoundary>
              } 
            />

            {/* Admin only - Camera Admin */}
            <Route 
              path="/camera-admin" 
              element={
                <RouteErrorBoundary fallbackMessage="Unable to load camera management">
                  <Suspense fallback={<PageLoader />}>
                    <AdminRoute user={user} role={role}>
                      <CameraAdmin />
                    </AdminRoute>
                  </Suspense>
                </RouteErrorBoundary>
              } 
            />

            {/* System Users - Dynamic based on role */}
            <Route 
              path="/system-users" 
              element={
                <RouteErrorBoundary fallbackMessage="Unable to load users page">
                  <Suspense fallback={<PageLoader />}>
                    {role === "superadmin"
                      ? <SuperAdminRoute user={user} role={role}><SuperAdminUsers /></SuperAdminRoute>
                      : <AdminRoute user={user} role={role}><SystemUsers /></AdminRoute>}
                  </Suspense>
                </RouteErrorBoundary>
              } 
            />

            {/* Super Admin only - Organizations */}
            <Route 
              path="/organizations" 
              element={
                <RouteErrorBoundary fallbackMessage="Unable to load organizations">
                  <Suspense fallback={<PageLoader />}>
                    <SuperAdminRoute user={user} role={role}><Organizations /></SuperAdminRoute>
                  </Suspense>
                </RouteErrorBoundary>
              } 
            />

            {/* Super Admin only - System Settings */}
            <Route 
              path="/system-settings" 
              element={
                <RouteErrorBoundary fallbackMessage="Unable to load system settings">
                  <Suspense fallback={<PageLoader />}>
                    <SuperAdminRoute user={user} role={role}><SystemSetting /></SuperAdminRoute>
                  </Suspense>
                </RouteErrorBoundary>
              } 
            />

          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />

        </Routes>
      </AuthLoader>
    </div>
  );
};

export default AppRoutes;
