import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { authAPI } from "../utils/api";
import statesDistrictsData from "../data/statesDistricts.json";
import styles from "../styles/Register.module.css";

export default function ParticipantRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    aadhaarNumber: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    state: "",
    nearbyDistricts: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const districtsByState = useMemo(
    () =>
      Object.fromEntries(
        statesDistrictsData.states.map((state) => [
          state.label,
          statesDistrictsData.districts[state.value] || [],
        ]),
      ),
    [],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "state") {
      setFormData((prev) => ({
        ...prev,
        state: value,
        nearbyDistricts: [],
      }));
      return;
    }

    if (name === "aadhaarNumber") {
      setFormData((prev) => ({
        ...prev,
        aadhaarNumber: value.replace(/\D/g, "").slice(0, 12),
      }));
      return;
    }

    if (name === "phone") {
      setFormData((prev) => ({
        ...prev,
        phone: value.replace(/\D/g, "").slice(0, 10),
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDistrictChange = (district) => {
    setFormData((prev) => {
      const districts = prev.nearbyDistricts || [];

      if (districts.includes(district)) {
        return {
          ...prev,
          nearbyDistricts: districts.filter((item) => item !== district),
        };
      }

      if (districts.length >= 3) {
        return prev;
      }

      return {
        ...prev,
        nearbyDistricts: [...districts, district],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.aadhaarNumber.length !== 12) {
      setError("Aadhaar number must be exactly 12 digits.");
      return;
    }

    if (formData.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    if (formData.nearbyDistricts.length !== 3) {
      setError("Please select exactly 3 nearby districts.");
      return;
    }

    setLoading(true);
    try {
      await authAPI.participantRegister(formData);
      alert("Registration successful. Please log in with your email and Aadhaar number.");
      navigate("/login?role=participant");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const availableDistricts = districtsByState[formData.state] || [];

  return (
    <>
      <Navbar />
      <div className={styles["register-container"]}>
        <div className={styles["register-card"]}>
          <div className={styles["register-header"]}>
            <h1 className={styles["register-title"]}>Participant Registration</h1>
            <p className={styles["register-subtitle"]}>
              Create your participant profile to access training login and updates
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className={styles["register-form"]}>
            <div className={styles["register-form-row"]}>
              <div className={styles["register-form-group"]}>
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles["register-form-group"]}>
                <label>Aadhaar Number</label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  placeholder="12-digit Aadhaar"
                  maxLength="12"
                  required
                />
              </div>
            </div>

            <div className={styles["register-form-row"]}>
              <div className={styles["register-form-group"]}>
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className={styles["register-form-group"]}>
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  maxLength="10"
                  required
                />
              </div>
            </div>

            <div className={styles["register-form-row"]}>
              <div className={styles["register-form-group"]}>
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles["register-form-group"]}>
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className={styles["register-form-row"]}>
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
                    <option key={state.value} value={state.label}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles["register-form-group"]}>
                <label>Nearby Districts</label>
                <input
                  type="text"
                  value={`${formData.nearbyDistricts.length}/3 selected`}
                  readOnly
                />
              </div>
            </div>

            {formData.state && (
              <div className={styles.districtSection}>
                <h3>Select 3 Nearby Districts</h3>
                <div className={styles.districtGrid}>
                  {availableDistricts.map((district) => (
                    <label key={district} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.nearbyDistricts.includes(district)}
                        onChange={() => handleDistrictChange(district)}
                        disabled={
                          !formData.nearbyDistricts.includes(district) &&
                          formData.nearbyDistricts.length >= 3
                        }
                      />
                      {district}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className={styles["register-btn"]}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </button>
          </form>

          <div className={styles["register-footer"]}>
            Already registered?{" "}
            <button
              type="button"
              onClick={() => navigate("/login?role=participant")}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--primary-color)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Login here
            </button>
          </div>
        </div>
      </div>
    </>
  );
}