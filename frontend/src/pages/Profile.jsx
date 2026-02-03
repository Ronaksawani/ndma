import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "../styles/Dashboard.module.css";
import statesDistrictsData from "../data/statesDistricts.json";

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Organization form state
  const [orgForm, setOrgForm] = useState({
    organizationName: "",
    state: "",
    district: "",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    // Initialize form with user data
    if (user) {
      setOrgForm({
        organizationName: user.organizationName || "",
        state: user.state || "",
        district: user.district || "",
        address: user.address || "",
        contactPerson: user.contactPerson || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Update districts when state changes
  useEffect(() => {
    if (orgForm.state) {
      const selectedState = statesDistrictsData.districts[orgForm.state];
      setDistricts(selectedState || []);
      setOrgForm((prev) => ({ ...prev, district: "" }));
    } else {
      setDistricts([]);
    }
  }, [orgForm.state]);

  const handleOrgChange = (e) => {
    const { name, value } = e.target;
    setOrgForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveOrgChanges = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Add API call to update partner profile
      // const response = await partnerAPI.update(user.partnerId, orgForm);
      setSuccessMessage("Organization details updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setErrorMessage("Failed to update organization details");
      console.error(err);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage("New passwords do not match");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setLoading(true);
    try {
      // TODO: Add API call to change password
      // const response = await authAPI.changePassword({
      //   currentPassword: passwordForm.currentPassword,
      //   newPassword: passwordForm.newPassword,
      // });
      setSuccessMessage("Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setErrorMessage("Failed to update password");
      console.error(err);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container">
      <Sidebar role="partner" />
      <div className="main-content">
        <div className="top-nav">
          <h2 className="nav-title">
            Partner Profile Settings -{" "}
            {user?.organizationName || "[Organization Name]"}
          </h2>
          <div className="nav-right">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.contactPerson?.[0]?.toUpperCase()}
              </div>
              <span>Partner (NGO/SDMA)</span>
            </div>
          </div>
        </div>

        <div className="page-content">
          {successMessage && (
            <div
              style={{
                backgroundColor: "#d1fae5",
                color: "#10b981",
                padding: "12px 16px",
                borderRadius: "6px",
                marginBottom: "16px",
                border: "1px solid #10b981",
                fontSize: "13px",
              }}
            >
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#ef4444",
                padding: "12px 16px",
                borderRadius: "6px",
                marginBottom: "16px",
                border: "1px solid #ef4444",
                fontSize: "13px",
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Organization Profile Section */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                marginBottom: "16px",
                color: "#1f2937",
                fontSize: "15px",
                fontWeight: "600",
              }}
            >
              Organization Profile
            </h3>

            <form onSubmit={handleSaveOrgChanges}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "13px",
                    }}
                  >
                    Organization Name
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    value={orgForm.organizationName}
                    onChange={handleOrgChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "13px",
                    }}
                  >
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={orgForm.contactPerson}
                    onChange={handleOrgChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "13px",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={orgForm.email}
                    onChange={handleOrgChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "13px",
                    }}
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={orgForm.phone}
                    onChange={handleOrgChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "13px",
                    }}
                  >
                    State
                  </label>
                  <select
                    name="state"
                    value={orgForm.state}
                    onChange={handleOrgChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Select State</option>
                    {statesDistrictsData.states.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "13px",
                    }}
                  >
                    District
                  </label>
                  <select
                    name="district"
                    value={orgForm.district}
                    onChange={handleOrgChange}
                    disabled={!orgForm.state}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      backgroundColor: !orgForm.state ? "#f3f4f6" : "white",
                    }}
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "600",
                    color: "#1f2937",
                    fontSize: "13px",
                  }}
                >
                  Address
                </label>
                <textarea
                  name="address"
                  value={orgForm.address}
                  onChange={handleOrgChange}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Change Password Section */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <h3
              style={{
                marginBottom: "16px",
                color: "#1f2937",
                fontSize: "15px",
                fontWeight: "600",
              }}
            >
              Change Password
            </h3>

            <form onSubmit={handleUpdatePassword}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "13px",
                    }}
                  >
                    Current Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        paddingRight: "36px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                      }}
                    >
                      {showPassword.current ? (
                        <FiEyeOff size={16} />
                      ) : (
                        <FiEye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "13px",
                    }}
                  >
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        paddingRight: "36px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                      }
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                      }}
                    >
                      {showPassword.new ? (
                        <FiEyeOff size={16} />
                      ) : (
                        <FiEye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "13px",
                    }}
                  >
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        paddingRight: "36px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                      }}
                    >
                      {showPassword.confirm ? (
                        <FiEyeOff size={16} />
                      ) : (
                        <FiEye size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
