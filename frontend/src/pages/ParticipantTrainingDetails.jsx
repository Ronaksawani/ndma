import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { FiMenu } from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "../components/Sidebar";
import { trainingAPI, participantAPI } from "../utils/api";
import styles from "../styles/Participant.module.css";

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

export default function ParticipantTrainingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchTrainingDetails();
    fetchProfile();
  }, [id]);

  const fetchTrainingDetails = async () => {
    try {
      setLoading(true);
      if (id) {
        const res = await trainingAPI.getById(id);
        setTraining(res.data);
        setIsRegistered(res.data?.isRegistered || false);
      } else {
        // Show all participated trainings if no specific ID
        const dashboardRes = await participantAPI.getDashboard();
        const trainings = dashboardRes.data?.myTrainingDetails || [];
        if (trainings.length > 0) {
          setTraining(trainings[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch training details", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await participantAPI.getProfile();
      setProfile(res.data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const handleRegister = async () => {
    if (!training) return;
    
    try {
      setRegistering(true);
      await trainingAPI.register(training._id);
      setIsRegistered(true);
      alert("Successfully registered for this training!");
    } catch (error) {
      console.error("Failed to register", error);
      alert("Failed to register for training");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar role="participant" />
        <main className={styles.main}>
          <header className={styles.topBar}>
            <h1 className={styles.title}>Training Details</h1>
          </header>
          <section className={styles.page}>
            <p>Loading...</p>
          </section>
        </main>
      </div>
    );
  }

  if (!training) {
    return (
      <div className={styles.layout}>
        <Sidebar role="participant" />
        <main className={styles.main}>
          <header className={styles.topBar}>
            <h1 className={styles.title}>Training Details</h1>
          </header>
          <section className={styles.page}>
            <p>Training not found</p>
            <button onClick={() => navigate(-1)} className={styles.backBtn}>
              Go Back
            </button>
          </section>
        </main>
      </div>
    );
  }

  const isUpcoming = new Date(training.startDate) > new Date();

  return (
    <div className={styles.layout}>
      <Sidebar role="participant" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={styles.main}>
        <header className={styles.topBar}>
          <button 
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <FiMenu size={24} />
          </button>
          <button onClick={() => navigate(-1)} className={styles.backLink}>
            ← Back
          </button>
          <h1 className={styles.title}>Training Details</h1>
        </header>
        <section className={styles.page}>
          <div className={styles.trainingDetailContainer}>
            {/* Header */}
            <div className={styles.trainingHeader}>
              <div>
                <h1 className={styles.trainingDetailTitle}>{training.title}</h1>
                <p className={styles.trainingThemeDetail}>{training.theme}</p>
              </div>
              <div className={styles.trainingStatus}>
                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                  {training.status}
                </span>
              </div>
            </div>

            {/* Main Content */}
            <div className={styles.detailsGrid}>
              {/* Left Column */}
              <div className={styles.detailsLeft}>
                {/* Overview Card */}
                <div className={styles.detailCard}>
                  <h3>📋 Overview</h3>
                  <div className={styles.cardContent}>
                    <p className={styles.description}>
                      {training.description || "No description provided"}
                    </p>
                  </div>
                </div>

                {/* Training Information */}
                <div className={styles.detailCard}>
                  <h3>📅 Training Schedule</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Start Date</span>
                      <span className={styles.infoValue}>
                        {new Date(training.startDate).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>End Date</span>
                      <span className={styles.infoValue}>
                        {new Date(training.endDate).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className={styles.detailCard}>
                  <h3>📍 Location</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>State</span>
                      <span className={styles.infoValue}>{training.location?.state}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>District</span>
                      <span className={styles.infoValue}>
                        {training.location?.district}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>City</span>
                      <span className={styles.infoValue}>{training.location?.city}</span>
                    </div>
                  </div>
                  <p className={styles.address}>{training.location?.address}</p>
                </div>

                {/* Trainer Information */}
                <div className={styles.detailCard}>
                  <h3>👨‍🏫 Trainer</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Name</span>
                      <span className={styles.infoValue}>
                        {training.trainerName || "-"}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoValue}>
                        {training.trainerEmail || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Participants Information */}
                <div className={styles.detailCard}>
                  <h3>👥 Participants</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Total Registered</span>
                      <span className={styles.infoValue}>
                        {training.registrationCount || 0}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Capacity</span>
                      <span className={styles.infoValue}>
                        {training.participantsCount || "Unlimited"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className={styles.detailsRight}>
                {/* Map */}
                {training.location?.latitude && training.location?.longitude && (
                  <div className={styles.detailCard}>
                    <h3>🗺️ Map</h3>
                    <div className={styles.mapContainer}>
                      <MapContainer
                        center={[training.location.latitude, training.location.longitude]}
                        zoom={13}
                        style={{ height: "300px", width: "100%", borderRadius: "8px" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                          position={[training.location.latitude, training.location.longitude]}
                        >
                          <Popup>{training.title}</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                )}

                {/* Your Information */}
                {profile && isUpcoming && (
                  <div className={styles.detailCard}>
                    <h3>ℹ️ Your Information</h3>
                    <div className={styles.profilePreview}>
                      <div className={styles.previewField}>
                        <span>Name: {profile.fullName}</span>
                      </div>
                      <div className={styles.previewField}>
                        <span>Email: {profile.email}</span>
                      </div>
                      <div className={styles.previewField}>
                        <span>Phone: {profile.phone || "-"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Registration Status */}
                <div className={styles.detailCard}>
                  <h3>✓ Status</h3>
                  <div className={styles.statusBox}>
                    {isRegistered ? (
                      <>
                        <div className={styles.registeredIcon}>✅</div>
                        <p>You are registered for this training</p>
                      </>
                    ) : isUpcoming ? (
                      <>
                        <div className={styles.unregisteredIcon}>📝</div>
                        <p>You haven't registered yet</p>
                      </>
                    ) : (
                      <>
                        <div className={styles.completedIcon}>🏆</div>
                        <p>This training is in the past</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isUpcoming && !isRegistered && (
                  <button
                    className={styles.registerBtn}
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? "Registering..." : "Register Now"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
