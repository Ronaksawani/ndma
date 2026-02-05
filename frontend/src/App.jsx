import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./styles/common.css";
import "leaflet/dist/leaflet.css";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PartnerRegistrationGuide from "./pages/PartnerRegistrationGuide";
import VerifyCertificate from "./pages/VerifyCertificate";
import Calendar from "./pages/Calendar";
import Resources from "./pages/Resources";
import PartnerDashboard from "./pages/PartnerDashboard";
import AddTraining from "./pages/AddTraining";
import EditTraining from "./pages/EditTraining";
import ViewTraining from "./pages/ViewTraining";
import MyTrainings from "./pages/MyTrainings";
import PartnerReports from "./pages/PartnerReports";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTrainingEvents from "./pages/AdminTrainingEvents";
import AdminReviewTraining from "./pages/AdminReviewTraining";
import AdminPartners from "./pages/AdminPartners";
import AdminManagePartner from "./pages/AdminManagePartner";
import AdminReports from "./pages/AdminReports";

// Protected Route Component
function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/partner-registration-guide"
        element={<PartnerRegistrationGuide />}
      />
      <Route path="/verify" element={<VerifyCertificate />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/resources" element={<Resources />} />

      {/* Partner Routes */}
      <Route
        path="/partner/dashboard"
        element={
          <ProtectedRoute role="partner">
            <PartnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner/add-training"
        element={
          <ProtectedRoute role="partner">
            <AddTraining />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner/edit-training/:id"
        element={
          <ProtectedRoute role="partner">
            <EditTraining />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner/view-training/:id"
        element={
          <ProtectedRoute role="partner">
            <ViewTraining />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner/my-trainings"
        element={
          <ProtectedRoute role="partner">
            <MyTrainings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner/reports"
        element={
          <ProtectedRoute role="partner">
            <PartnerReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner/profile"
        element={
          <ProtectedRoute role="partner">
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/training-events"
        element={
          <ProtectedRoute role="admin">
            <AdminTrainingEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/training/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminReviewTraining />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/partners"
        element={
          <ProtectedRoute role="admin">
            <AdminPartners />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/partner/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminManagePartner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/add-partner"
        element={
          <ProtectedRoute role="admin">
            <Register />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <AdminReports />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
