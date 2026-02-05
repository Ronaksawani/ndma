import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import styles from "../styles/Home.module.css";
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";

export default function PartnerRegistrationGuide() {
  const navigate = useNavigate();

  return (
    <div className={styles["home-wrapper"]}>
      <Navbar />

      <div className={styles["home-container"]}>
        {/* Guide Section */}
        <section
          style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "3rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: "700",
                color: "#1a1a1a",
                marginBottom: "1rem",
              }}
            >
              Partner Registration Process
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "#666",
                marginBottom: "2rem",
              }}
            >
              Join our network of disaster management organizations across India
            </p>

            {/* Step 1: Contact */}
            <div
              style={{
                marginBottom: "2rem",
                paddingBottom: "2rem",
                borderBottom: "2px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.5rem",
                }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "1.1rem",
                    fontWeight: "700",
                  }}
                >
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#1a1a1a",
                      marginBottom: "1rem",
                    }}
                  >
                    <FiMail
                      style={{ display: "inline", marginRight: "0.5rem" }}
                    />
                    Send an Email or Call Us
                  </h2>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#555",
                      marginBottom: "1rem",
                      lineHeight: "1.6",
                    }}
                  >
                    Initiate the registration process by contacting us through
                    email or phone.
                  </p>
                  <div
                    style={{
                      background: "#f5f7fa",
                      padding: "1.5rem",
                      borderRadius: "8px",
                      borderLeft: "4px solid #667eea",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      <FiMail size={20} color="#667eea" />
                      <strong>Email:</strong> contact@ndma.gov.in
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      <FiPhone size={20} color="#667eea" />
                      <strong>Phone:</strong> +91-11-2634-5858
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Details & Documents */}
            <div
              style={{
                marginBottom: "2rem",
                paddingBottom: "2rem",
                borderBottom: "2px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.5rem",
                }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "1.1rem",
                    fontWeight: "700",
                  }}
                >
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#1a1a1a",
                      marginBottom: "1rem",
                    }}
                  >
                    <FiFileText
                      style={{ display: "inline", marginRight: "0.5rem" }}
                    />
                    Provide Organization Details & Documents
                  </h2>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#555",
                      marginBottom: "1rem",
                      lineHeight: "1.6",
                    }}
                  >
                    Our team will ask for the following information and
                    supporting documents:
                  </p>
                  <ul
                    style={{
                      background: "#f5f7fa",
                      padding: "1.5rem",
                      borderRadius: "8px",
                      borderLeft: "4px solid #667eea",
                      listStyle: "none",
                      margin: 0,
                    }}
                  >
                    <li
                      style={{
                        marginBottom: "0.75rem",
                        paddingLeft: "1.5rem",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "#667eea",
                          fontWeight: "700",
                        }}
                      >
                        ✓
                      </span>
                      Organization name and registration details
                    </li>
                    <li
                      style={{
                        marginBottom: "0.75rem",
                        paddingLeft: "1.5rem",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "#667eea",
                          fontWeight: "700",
                        }}
                      >
                        ✓
                      </span>
                      Contact person details (name, email, phone)
                    </li>
                    <li
                      style={{
                        marginBottom: "0.75rem",
                        paddingLeft: "1.5rem",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "#667eea",
                          fontWeight: "700",
                        }}
                      >
                        ✓
                      </span>
                      Organization type (Government/NGO/Private/Training
                      Institute)
                    </li>
                    <li
                      style={{
                        marginBottom: "0.75rem",
                        paddingLeft: "1.5rem",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "#667eea",
                          fontWeight: "700",
                        }}
                      >
                        ✓
                      </span>
                      Location (State, District, Address)
                    </li>
                    <li
                      style={{
                        marginBottom: "0.75rem",
                        paddingLeft: "1.5rem",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "#667eea",
                          fontWeight: "700",
                        }}
                      >
                        ✓
                      </span>
                      Supporting documents and proof of authorization
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3: Approval & Registration */}
            <div
              style={{
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.5rem",
                }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "1.1rem",
                    fontWeight: "700",
                  }}
                >
                  3
                </div>
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#1a1a1a",
                      marginBottom: "1rem",
                    }}
                  >
                    <FiCheckCircle
                      style={{ display: "inline", marginRight: "0.5rem" }}
                    />
                    Admin Review & Registration
                  </h2>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#555",
                      marginBottom: "1rem",
                      lineHeight: "1.6",
                    }}
                  >
                    Our admin team will review your application and documents.
                    Upon approval, you will be registered in the system and
                    assigned login credentials.
                  </p>
                  <div
                    style={{
                      background: "#f5f7fa",
                      padding: "1.5rem",
                      borderRadius: "8px",
                      borderLeft: "4px solid #667eea",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#555",
                        lineHeight: "1.6",
                      }}
                    >
                      <strong>Confirmation Email:</strong> You will receive a
                      confirmation email with your login details and
                      instructions to access the portal.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div
              style={{
                background: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "8px",
                padding: "1.5rem",
                marginTop: "2rem",
              }}
            >
              <h3
                style={{
                  color: "#856404",
                  marginTop: 0,
                  marginBottom: "0.5rem",
                  fontSize: "1rem",
                }}
              >
                ⚠️ Important Notes
              </h3>
              <ul
                style={{
                  color: "#856404",
                  margin: 0,
                  paddingLeft: "1.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <li style={{ marginBottom: "0.5rem" }}>
                  Please ensure all documents are authentic and properly
                  authorized
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Registration may take 3-5 business days for review
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  Contact us if you have any questions during the process
                </li>
                <li>
                  Once registered, you can log in and start submitting training
                  data
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
