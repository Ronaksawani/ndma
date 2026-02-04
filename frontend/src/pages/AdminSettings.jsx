import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiLock, FiLogOut, FiTrash2, FiEye, FiEyeOff } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import styles from "../styles/AdminSettings.module.css";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Validation
    if (!passwordForm.currentPassword) {
      setError("Current password is required");
      return;
    }
    if (!passwordForm.newPassword) {
      setError("New password is required");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/auth/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:5000/api/auth/delete-account", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/admin/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      <Sidebar />
      <div className={styles.container}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your account and security preferences</p>
      </div>

      {/* Messages */}
      {message && <div className={styles.successMessage}>{message}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}
      {/* Change Password Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <FiLock size={24} />
          <h2>Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Current Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPasswords.current ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="Enter your current password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className={styles.toggleBtn}
              >
                {showPasswords.current ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>New Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="Enter new password (min 6 characters)"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className={styles.toggleBtn}
              >
                {showPasswords.new ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Confirm New Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Re-enter new password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className={styles.toggleBtn}
              >
                {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Logout Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <FiLogOut size={24} />
          <h2>Logout</h2>
        </div>
        <p className={styles.cardDescription}>Sign out from your account</p>
        <button
          onClick={handleLogout}
          className={styles.logoutBtn}
          disabled={loading}
        >
          <FiLogOut size={18} />
          Logout Now
        </button>
      </div>

      {/* Delete Account Section */}
      <div className={styles.card + " " + styles.dangerCard}>
        <div className={styles.cardHeader}>
          <FiTrash2 size={24} style={{ color: "#dc3545" }} />
          <h2 style={{ color: "#dc3545" }}>Delete Account</h2>
        </div>
        <p className={styles.cardDescription}>
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={styles.deleteBtn}
            disabled={loading}
          >
            <FiTrash2 size={18} />
            Delete Account
          </button>
        ) : (
          <div className={styles.deleteConfirmation}>
            <p className={styles.warningText}>
              ⚠️ This will permanently delete your account and cannot be
              reversed. All your data will be lost.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
              placeholder='Type "DELETE" to confirm'
              className={styles.deleteConfirmInput}
            />
            <div className={styles.deleteConfirmButtons}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setError("");
                }}
                className={styles.cancelBtn}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className={styles.confirmDeleteBtn}
                disabled={loading || deleteConfirmText !== "DELETE"}
              >
                {loading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
