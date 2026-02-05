import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { authAPI } from "../utils/api";
import statesDistrictsData from "../data/statesDistricts.json";
import styles from "../styles/Register.module.css";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.includes("/admin/add-partner");
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationType: "ngo",
    state: "",
    district: "",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [districts, setDistricts] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "state") {
      // When state changes, update districts and reset district selection
      const selectedStateDistricts = statesDistrictsData.districts[value] || [];
      setDistricts(selectedStateDistricts);
      setFormData((prev) => ({ ...prev, [name]: value, district: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Prepare form data
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== "confirmPassword") {
          data.append(key, formData[key]);
        }
      });

      await authAPI.register(data);
      alert(
        isAdminRoute
          ? "Partner added successfully!"
          : "Registration submitted successfully! Please wait for admin approval.",
      );
      navigate(isAdminRoute ? "/admin/partners" : "/login?role=partner");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className={styles["register-form"]}>
      {/* Organization Details */}
      <div className={styles["register-form-row"] + " " + styles["full"]}>
        <div className={styles["register-form-group"]}>
          <label>Organization Name</label>
          <input
            type="text"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles["register-form-row"]}>
        <div className={styles["register-form-group"]}>
          <label>Organization Type</label>
          <select
            name="organizationType"
            value={formData.organizationType}
            onChange={handleChange}
            required
          >
            <option value="govt">Government</option>
            <option value="ngo">NGO</option>
            <option value="private">Private</option>
            <option value="training">Training Institute</option>
          </select>
        </div>
        <div className={styles["register-form-group"]}>
          <label>State</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
          >
            <option value="">Select State</option>
            {statesDistrictsData.states.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles["register-form-row"]}>
        <div className={styles["register-form-group"]}>
          <label>District</label>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            disabled={!formData.state}
            required
          >
            <option value="">Select District</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
        <div className={styles["register-form-group"]}>
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className={styles["register-form-row"]}>
        <div className={styles["register-form-group"]}>
          <label>Contact Person Name</label>
          <input
            type="text"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles["register-form-group"]}>
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles["register-form-row"] + " " + styles["full"]}>
        <div className={styles["register-form-group"]}>
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Credentials */}
      <div className={styles["register-form-row"]}>
        <div className={styles["register-form-group"]}>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles["register-form-group"]}>
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className={styles["register-btn"]}
        disabled={loading}
      >
        {loading ? "Registering..." : "Register Organization"}
      </button>
    </form>
  );

  const renderRegisterCard = () => (
    <div className={styles["register-card"]}>
      <div className={styles["register-header"]}>
        <h1 className={styles["register-title"]}>
          {isAdminRoute ? "Add New Partner" : "Partner Registration"}
        </h1>
        <p className={styles["register-subtitle"]}>
          {isAdminRoute
            ? "Add a new partner organization to the system"
            : "Register your organization to submit training data"}
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {renderForm()}

      {!isAdminRoute && (
        <div className={styles["register-footer"]}>
          Already registered? <a href="/login">Login here</a>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isAdminRoute ? (
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar role="admin" />
          <div
            style={{
              flex: 1,
              marginLeft: "200px",
              background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            }}
          >
            <div className={styles["register-container"]}>
              {renderRegisterCard()}
            </div>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <div className={styles["register-container"]}>
            {renderRegisterCard()}
          </div>
        </>
      )}
    </>
  );
}
