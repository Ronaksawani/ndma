import React, { useState } from "react";
import Navbar from "../components/Navbar";
import styles from "../styles/Verify.module.css";
import { FiSearch, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { certificateAPI } from "../utils/api";

export default function VerifyCertificate() {
  const [certificateId, setCertificateId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    const aadhaarInput = certificateId.replace(/\D/g, "");

    if (!aadhaarInput.trim()) {
      setError("Please enter an Aadhaar number");
      return;
    }

    if (!/^\d{12}$/.test(aadhaarInput)) {
      setError("Aadhaar number must be exactly 12 digits");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await certificateAPI.verifyByAadhaar(aadhaarInput);
      if (response.data.success && response.data.verified) {
        setResult({
          verified: true,
          aadhaarNumber: response.data.aadhaarNumber,
          fullName: response.data.fullName,
          trainingTitle: response.data.trainingTitle,
          trainingTheme: response.data.trainingTheme,
          trainingDates: response.data.trainingDates,
          organization: response.data.organization,
          certificateIssuedAt: response.data.certificateIssuedAt,
        });
      } else {
        setError(
          response.data.message ||
            "Certificate not found. Please check the Aadhaar number."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to verify certificate. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["wrapper"]}>
      <Navbar />

      <div className={styles["container"]}>
        <section className={styles["hero"]}>
          <h1 className={styles["title"]}>Verify Certificate</h1>
          <p className={styles["subtitle"]}>
            Verify the authenticity of disaster management training certificates issued through this portal
          </p>
        </section>

        <section className={styles["content"]}>
          <div className={styles["search-box"]}>
            <form onSubmit={handleVerify}>
              <div className={styles["input-group"]}>
                {/* <FiSearch className={styles["input-icon"]} /> */}
                <input
                  type="text"
                  placeholder="Enter 12-digit Aadhaar Number"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  className={styles["input"]}
                  inputMode="numeric"
                  maxLength="12"
                />
                <button
                  type="submit"
                  className={styles["btn"]}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify"}
                </button>
              </div>
            </form>

            {error && (
              <div className={styles["alert"] + " " + styles["alert-error"]}>
                <FiAlertCircle />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className={styles["result-card"]}>
                <div className={styles["result-header"]}>
                  <FiCheckCircle className={styles["result-icon"]} />
                  <h3 className={styles["result-title"]}>
                    Certificate Verified ✓
                  </h3>
                </div>

                <div className={styles["result-details"]}>
                  <div className={styles["detail-row"]}>
                    <label>Aadhaar ID:</label>
                    <span>{result.aadhaarNumber}</span>
                  </div>
                  <div className={styles["detail-row"]}>
                    <label>Trainee Name:</label>
                    <span>{result.fullName}</span>
                  </div>
                  <div className={styles["detail-row"]}>
                    <label>Training Title:</label>
                    <span>{result.trainingTitle}</span>
                  </div>
                  <div className={styles["detail-row"]}>
                    <label>Training Theme:</label>
                    <span>{result.trainingTheme}</span>
                  </div>
                  <div className={styles["detail-row"]}>
                    <label>Training Date:</label>
                    <span>
                      {typeof result.trainingDates === "object" && result.trainingDates.start
                        ? `${new Date(result.trainingDates.start).toLocaleDateString()} - ${new Date(
                            result.trainingDates.end
                          ).toLocaleDateString()}`
                        : result.trainingDates || "N/A"}
                    </span>
                  </div>
                  <div className={styles["detail-row"]}>
                    <label>Organization:</label>
                    <span>{result.organization}</span>
                  </div>
                </div>

                <div className={styles["result-footer"]}>
                  <p>
                    This certificate is valid and issued by NDMA Training Portal.
                    <br />
                    Certificate verified on:{" "}
                    {result.certificateIssuedAt
                      ? new Date(result.certificateIssuedAt).toLocaleDateString()
                      : new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={styles["info-section"]}>
            <h2>About Certificate Verification</h2>
            <div className={styles["info-grid"]}>
              <div className={styles["info-card"]}>
                <h4>What is this?</h4>
                <p>
                  This service allows you to verify the authenticity of training
                  certificates issued by organizations registered with our portal.
                </p>
              </div>
              <div className={styles["info-card"]}>
                <h4>How does it work?</h4>
                <p>
                  Enter your 12-digit Aadhaar number as mentioned in your training
                  certificate. Our system will verify the certificate against our database.
                </p>
              </div>
              <div className={styles["info-card"]}>
                <h4>Why verify?</h4>
                <p>
                  Verification ensures that the certificate is legitimate and issued
                  by a registered training partner approved by NDMA.
                </p>
              </div>
              <div className={styles["info-card"]}>
                <h4>Need help?</h4>
                <p>
                  If you have questions about your certificate, contact the issuing
                  organization directly or reach out to our support team.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className={styles["footer"]}>
        <p>
          &copy; 2024 National Disaster Management Authority (NDMA). All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
