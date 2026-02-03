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
import VerifyCertificate from "./pages/VerifyCertificate";
import Calendar from "./pages/Calendar";
import Resources from "./pages/Resources";
import PartnerDashboard from "./pages/PartnerDashboard";
import AddTraining from "./pages/AddTraining";
import EditTraining from "./pages/EditTraining";
import ViewTraining from "./pages/ViewTraining";
import MyTrainings from "./pages/MyTrainings";
import Profile from "./pages/Profile";

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
        path="/partner/profile"
        element={
          <ProtectedRoute role="partner">
            <Profile />
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
