import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import Sidebar from "../components/Sidebar";
import { trainingAPI } from "../utils/api";
import styles from "../styles/AdminReviewTraining.module.css";
import { FiChevronLeft, FiChevronRight, FiDownload } from "react-icons/fi";

// Fix Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const AdminReviewTraining = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTrainingDetails();
  }, [id]);

  const fetchTrainingDetails = async () => {
    try {
      setLoading(true);
      const response = await trainingAPI.getById(id);
      setTraining(response.data);
    } catch (error) {
      console.error("Error fetching training:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await trainingAPI.updateStatus(id, "approved");
      alert("Training approved successfully!");
      fetchTrainingDetails();
    } catch (error) {
      console.error("Error approving training:", error);
      alert("Failed to approve training");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await trainingAPI.updateStatus(id, "rejected", comments);
      alert("Training rejected successfully!");
      fetchTrainingDetails();
    } catch (error) {
      console.error("Error rejecting training:", error);
      alert("Failed to reject training");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const downloadMedia = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename || "media";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  const downloadAllMedia = async () => {
    try {
      if (!training.photos || training.photos.length === 0) {
        alert("No photos to download");
        return;
      }

      // Download each photo
      for (const photo of training.photos) {
        await new Promise((resolve) => {
          setTimeout(() => {
            downloadMedia(photo.url, photo.filename);
            resolve();
          }, 300); // Add delay to prevent browser from blocking multiple downloads
        });
      }

      alert(`Downloaded ${training.photos.length} photos successfully!`);
    } catch (error) {
      console.error("Error downloading media:", error);
      alert("Failed to download some files");
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar role="admin" />
        <div className={styles.container}>
          <p>Loading training details...</p>
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className={styles.layout}>
        <Sidebar role="admin" />
        <div className={styles.container}>
          <p>Training not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar role="admin" />
      <div className={styles.container}>
        <div className={styles.navigationBar}>
          <button
            className={styles.navButton}
            onClick={() => navigate("/admin/training-events")}
          >
            <FiChevronLeft />
          </button>
          <button className={styles.navButton}>
            <FiChevronRight />
          </button>
        </div>

        <div className={styles.mainContent}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            <div className={styles.trainingDetailsBox}>
              <h2>Training Details</h2>
              <div className={styles.detailsGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Organizer</span>
                  <span className={styles.value}>
                    {training.partnerId?.organizationName || "N/A"}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Date</span>
                  <span className={styles.value}>
                    {training.startDate && training.endDate
                      ? `${formatDate(training.startDate)} - ${formatDate(
                          training.endDate
                        )}`
                      : "N/A"}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Location</span>
                  <span className={styles.value}>
                    {training.location?.city}, {training.location?.state}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Theme</span>
                  <span className={styles.value}>{training.theme || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Participants</span>
                  <span className={styles.value}>
                    {training.participantsCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Submitted Media */}
            <div className={styles.mediaBox}>
              <div className={styles.mediaHeader}>
                <h2>Submitted Media</h2>
                {training.photos && training.photos.length > 0 && (
                  <button
                    className={styles.downloadAllBtn}
                    onClick={downloadAllMedia}
                    title="Download all photos"
                  >
                    <FiDownload /> Download All ({training.photos.length})
                  </button>
                )}
              </div>

              {training.photos && training.photos.length > 0 ? (
                <div className={styles.mediaGrid}>
                  {training.photos.map((photo, idx) => (
                    <div key={idx} className={styles.mediaItem}>
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className={styles.mediaImage}
                      />
                      <button
                        className={styles.downloadPhotoBtn}
                        onClick={() => downloadMedia(photo.url, photo.filename)}
                        title="Download this photo"
                      >
                        <FiDownload />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noMedia}>No media uploaded</p>
              )}

              {training.attendanceSheet && (
                <div className={styles.attendanceSection}>
                  <button
                    className={styles.downloadButton}
                    onClick={() =>
                      downloadMedia(
                        training.attendanceSheet.url,
                        training.attendanceSheet.filename
                      )
                    }
                  >
                    <FiDownload /> Download Participant List ({training.attendanceSheet.filename})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            {/* Map */}
            <div className={styles.mapBox}>
              {training.location?.latitude && training.location?.longitude ? (
                <MapContainer
                  center={[training.location.latitude, training.location.longitude]}
                  zoom={13}
                  className={styles.map}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <Marker
                    position={[
                      training.location.latitude,
                      training.location.longitude,
                    ]}
                  />
                </MapContainer>
              ) : (
                <div className={styles.noMapMessage}>
                  Location data not available
                </div>
              )}
            </div>

            {/* Admin Actions */}
            <div className={styles.adminActionsBox}>
              <h2>Admin Actions</h2>

              <div className={styles.commentsSection}>
                <label>Comments</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Comments on training..."
                  className={styles.commentTextarea}
                  disabled={training.status !== "pending"}
                />
              </div>

              <div className={styles.actionsButtonGroup}>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading || training.status !== "pending"}
                  className={styles.approveButton}
                >
                  ✓ Approve Training
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || training.status !== "pending"}
                  className={styles.rejectButton}
                >
                  ✕ Reject Training
                </button>
              </div>

              {training.status !== "pending" && (
                <div className={styles.statusMessage}>
                  Training status: <strong>{training.status.toUpperCase()}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewTraining;
