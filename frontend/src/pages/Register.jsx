import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CiFileOn } from "react-icons/ci";
import Navbar from "../components/Navbar";
import { authAPI, uploadAPI } from "../utils/api";
import statesDistrictsData from "../data/statesDistricts.json";
import styles from "../styles/Register.module.css";

export default function Register() {
  const navigate = useNavigate();
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
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [districts, setDistricts] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles["dragging"]);
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove(styles["dragging"]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles["dragging"]);
    setFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!file) {
      setError("Please upload authorization documents");
      return;
    }

    setLoading(true);
    try {
      // Upload file through backend to Cloudinary
      setUploadingFile(true);
      const uploadResponse = await uploadAPI.uploadSingle(
        file,
        "partner-documents"
      );
      setUploadingFile(false);

      if (!uploadResponse.data.success) {
        throw new Error(uploadResponse.data.error || "File upload failed");
      }

      const { url, publicId } = uploadResponse.data.data;

      // Prepare form data with Cloudinary URL
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== "confirmPassword") {
          data.append(key, formData[key]);
        }
      });
      data.append("documentUrl", url);
      data.append("documentPublicId", publicId);

      await authAPI.register(data);
      alert(
        "Registration submitted successfully! Please wait for admin approval."
      );
      navigate("/login?role=partner");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles["register-container"]}>
      <div className={styles["register-card"]}>
        <div className={styles["register-header"]}>
          <h1 className={styles["register-title"]}>Partner Registration</h1>
          <p className={styles["register-subtitle"]}>
            Register your organization to submit training data
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

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

          {/* Document Upload */}
          <div className={styles["register-form-row"] + " " + styles["full"]}>
            <div className={styles["register-form-group"]}>
              <label>Authorization Documents (PDF)</label>
              <div
                className={styles["upload-box"]}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  !uploadingFile && document.getElementById("doc-input").click()
                }
                style={{
                  cursor: uploadingFile ? "not-allowed" : "pointer",
                  opacity: uploadingFile ? 0.6 : 1,
                }}
              >
                <div className={styles["upload-box-icon"]}>
                  <CiFileOn size={40} />
                </div>
                <div className={styles["upload-box-text"]}>
                  {uploadingFile
                    ? "Uploading..."
                    : "Drag and drop or click to upload"}
                </div>
                <input
                  id="doc-input"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className={styles["file-input"]}
                  disabled={uploadingFile}
                />
              </div>
              {file && (
                <div style={{ marginTop: "10px", fontSize: "13px" }}>
                  Selected: {file.name}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={styles["register-btn"]}
            disabled={loading || uploadingFile}
          >
            {loading
              ? "Registering..."
              : uploadingFile
              ? "Uploading document..."
              : "Register Organization"}
          </button>
        </form>

        <div className={styles["register-footer"]}>
          Already registered? <a href="/login">Login here</a>
        </div>
      </div>
      </div>
    </>
  );
}
