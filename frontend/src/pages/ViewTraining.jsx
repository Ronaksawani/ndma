import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "../components/Sidebar";
import { trainingAPI } from "../utils/api";
import styles from "../styles/Form.module.css";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Static Map Viewer
function LocationViewer({ lat, lng }) {
  const position = [lat || 20.5937, lng || 78.9629];

  return (
    <MapContainer
      center={position}
      zoom={10}
      style={{ height: "300px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          Location: {position[0].toFixed(4)}, {position[1].toFixed(4)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}

const ViewField = ({ label, value }) => (
  <div className={styles["form-group"]} style={{ pointerEvents: "none" }}>
    <label>{label}</label>
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        backgroundColor: "#f9fafb",
        fontSize: "13px",
        color: "#374151",
        minHeight: "36px",
        display: "flex",
        alignItems: "center",
      }}
    >
      {value || "-"}
    </div>
  </div>
);

export default function ViewTraining() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrainingData();
  }, [id]);

  const fetchTrainingData = async () => {
    try {
      const response = await trainingAPI.getById(id);
      setTraining(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch training data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      approved: { color: "#10b981", bg: "#d1fae5", label: "Approved" },
      pending: { color: "#f59e0b", bg: "#fef3c7", label: "Pending" },
      rejected: { color: "#ef4444", bg: "#fee2e2", label: "Rejected" },
    };

    const style = statusStyles[status?.toLowerCase()] || statusStyles.pending;
    return (
      <span
        style={{
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="layout-container">
        <Sidebar role="partner" />
        <div className="main-content">
          <div style={{ padding: "40px", textAlign: "center" }}>
            Loading training details...
          </div>
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="layout-container">
        <Sidebar role="partner" />
        <div className="main-content">
          <div
            style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}
          >
            Training not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container">
      <Sidebar role="partner" />
      <div className="main-content">
        <div className="top-nav">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h2 className="nav-title">View Training Event</h2>
            {getStatusBadge(training.status)}
          </div>
        </div>

        <div className="page-content">
          <div className={styles["form-container"]}>
            <div className={styles["form-card"]}>
              {error && <div className="alert alert-danger">{error}</div>}

              {/* Event Details */}
              <div className={styles["form-section"]}>
                <h3 className={styles["form-section-title"]}>Event Details</h3>

                <div className={styles["form-row"]}>
                  <ViewField label="Training Title" value={training.title} />
                  <ViewField label="Theme" value={training.theme} />
                </div>

                <div className={styles["form-row"]}>
                  <ViewField
                    label="Start Date"
                    value={
                      training.startDate
                        ? new Date(training.startDate).toLocaleDateString()
                        : "-"
                    }
                  />
                  <ViewField
                    label="End Date"
                    value={
                      training.endDate
                        ? new Date(training.endDate).toLocaleDateString()
                        : "-"
                    }
                  />
                </div>
              </div>

              {/* Location Details */}
              <div className={styles["form-section"]}>
                <h3 className={styles["form-section-title"]}>
                  Location Details
                </h3>

                <div className={styles["form-row"] + " " + styles["three-col"]}>
                  <ViewField label="State" value={training.location?.state} />
                  <ViewField
                    label="District"
                    value={training.location?.district}
                  />
                  <ViewField
                    label="City/Village"
                    value={training.location?.city}
                  />
                </div>

                <div className={styles["form-row"] + " " + styles["three-col"]}>
                  <ViewField
                    label="Pincode"
                    value={training.location?.pincode}
                  />
                  <ViewField
                    label="Latitude"
                    value={training.location?.latitude?.toFixed(4)}
                  />
                  <ViewField
                    label="Longitude"
                    value={training.location?.longitude?.toFixed(4)}
                  />
                </div>

                <div style={{ marginTop: "20px" }}>
                  <label
                    style={{
                      marginBottom: "10px",
                      display: "block",
                      fontWeight: "600",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    Training Location
                  </label>
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <LocationViewer
                      lat={training.location?.latitude}
                      lng={training.location?.longitude}
                    />
                  </div>
                </div>
              </div>

              {/* Resource Person Details */}
              <div className={styles["form-section"]}>
                <h3 className={styles["form-section-title"]}>
                  Resource Person(s)
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 0.7fr",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <ViewField
                    label="Trainer Name"
                    value={training.trainerName}
                  />
                  <ViewField
                    label="Trainer Email"
                    value={training.trainerEmail}
                  />
                  <ViewField
                    label="Participants Count"
                    value={training.participantsCount}
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className={styles["form-section"]}>
                <h3 className={styles["form-section-title"]}>
                  Status & Timeline
                </h3>

                <div className={styles["form-row"]}>
                  <ViewField
                    label="Status"
                    value={
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            training.status === "approved"
                              ? "#d1fae5"
                              : training.status === "pending"
                              ? "#fef3c7"
                              : "#fee2e2",
                          color:
                            training.status === "approved"
                              ? "#10b981"
                              : training.status === "pending"
                              ? "#f59e0b"
                              : "#ef4444",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {training.status?.charAt(0).toUpperCase() +
                          training.status?.slice(1)}
                      </span>
                    }
                  />
                  <ViewField
                    label="Created"
                    value={
                      training.createdAt
                        ? new Date(training.createdAt).toLocaleDateString()
                        : "-"
                    }
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className={styles["form-actions"]}>
                <button
                  type="button"
                  className={
                    styles["form-btn"] + " " + styles["form-btn-cancel"]
                  }
                  onClick={() => navigate("/partner/my-trainings")}
                >
                  Back to My Trainings
                </button>
                <button
                  type="button"
                  className={
                    styles["form-btn"] + " " + styles["form-btn-submit"]
                  }
                  onClick={() => navigate(`/partner/edit-training/${id}`)}
                >
                  Edit Training
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
