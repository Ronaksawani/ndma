import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { participantAPI, trainingAPI } from "../utils/api";
import styles from "../styles/Participant.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function ParticipantUpcomingTrainings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [filteredTrainings, setFilteredTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    state: "",
    theme: "",
  });
  const [nearbyDistricts, setNearbyDistricts] = useState([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState("");
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    fetchTrainings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trainings, searchTerm, filters, nearbyDistricts]);

  useEffect(() => {
    const fetchSelectedTraining = async () => {
      if (!selectedTrainingId) {
        setSelectedTraining(null);
        setDetailError("");
        return;
      }

      try {
        setDetailLoading(true);
        setDetailError("");
        const trainingResponse = await trainingAPI.getById(selectedTrainingId);
        setSelectedTraining(trainingResponse.data);
      } catch (error) {
        console.error("Failed to fetch training details", error);
        setDetailError("Failed to load training details.");
        setSelectedTraining(null);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchSelectedTraining();
  }, [selectedTrainingId]);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const [dashboardRes, profileRes] = await Promise.all([
        participantAPI.getDashboard(),
        participantAPI.getProfile().catch(() => ({ data: {} })),
      ]);

      setTrainings(
        dashboardRes.data?.nearbyTrainings ||
          dashboardRes.data?.upcomingTrainings ||
          [],
      );
      setNearbyDistricts(profileRes.data?.nearbyDistricts || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = trainings;

    // Filter by status - only show upcoming and ongoing trainings
    filtered = filtered.filter(
      (t) => t.status === "upcoming" || t.status === "ongoing",
    );

    // Search filter - title only
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(term));
    }

    // State filter
    if (filters.state) {
      filtered = filtered.filter((t) => t.location?.state === filters.state);
    }

    // Theme (Disaster Type) filter
    if (filters.theme) {
      filtered = filtered.filter((t) => t.theme === filters.theme);
    }

    setFilteredTrainings(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({
      ...filters,
      [filterName]: value,
    });
  };

  const handleRowSelect = (training) => {
    setSelectedTrainingId(training._id);
  };

  const handleRegister = async () => {
    if (!selectedTraining || !selectedTrainingId) return;

    try {
      setDetailLoading(true);
      // Register user for the training
      const response = await trainingAPI.register(selectedTrainingId);

      alert("Successfully registered for the training!");
      // Refresh the selected training to show updated participant count
      const updatedTraining = await trainingAPI.getById(selectedTrainingId);
      setSelectedTraining(updatedTraining.data);
    } catch (error) {
      console.error("Registration failed:", error);
      alert(
        error.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToTrainings = () => {
    navigate("/participant/upcoming-trainings");
    setSelectedTrainingId("");
    setSelectedTraining(null);
    setDetailError("");
  };

  const getAvailableThemes = () => {
    const themes = new Set(trainings.map((t) => t.theme).filter(Boolean));
    return Array.from(themes).sort();
  };

  const getAvailableStates = () => {
    const states = new Set(
      trainings.map((t) => t.location?.state).filter(Boolean),
    );
    return Array.from(states).sort();
  };

  const renderTrainingDetailPanel = () => {
    if (!selectedTrainingId) {
      return (
        <div className={styles.trainingDetailContainer}>
          <div className={styles.trainingHeader}>
            <div>
              <h1 className={styles.trainingDetailTitle}>Training Details</h1>
              <p className={styles.trainingThemeDetail}>
                Select a training row to view its full details here.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (detailLoading) {
      return (
        <div className={styles.trainingDetailContainer}>
          <div className={styles.trainingHeader}>
            <div>
              <h1 className={styles.trainingDetailTitle}>Training Details</h1>
              <p className={styles.trainingThemeDetail}>
                Loading selected training...
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (detailError || !selectedTraining) {
      return (
        <div className={styles.trainingDetailContainer}>
          <div className={styles.trainingHeader}>
            <div>
              <h1 className={styles.trainingDetailTitle}>Training Details</h1>
              <p className={styles.trainingThemeDetail}>
                {detailError || "Training not found."}
              </p>
            </div>
          </div>
        </div>
      );
    }

    const training = selectedTraining;
    const isUpcoming = new Date(training.startDate) > new Date();
    const currentUserEmail = user?.email?.toLowerCase() || "";
    const isAlreadyRegistered =
      !!currentUserEmail &&
      Array.isArray(training.registeredParticipants) &&
      training.registeredParticipants.some(
        (participant) => participant.email?.toLowerCase() === currentUserEmail,
      );

    // Check if training is at full capacity
    const registeredCount = training.registeredParticipants?.length || 0;
    const isFull =
      training.participantsCount &&
      training.participantsCount > 0 &&
      registeredCount >= training.participantsCount;

    return (
      <div className={styles.trainingDetailContainer}>
        <div className={styles.trainingHeader}>
          <div>
            <h1 className={styles.trainingDetailTitle}>{training.title}</h1>
            <p className={styles.trainingThemeDetail}>{training.theme}</p>
          </div>
          <div className={styles.trainingActions}>
            {isUpcoming && !isFull && (
              <button
                onClick={handleRegister}
                disabled={detailLoading || isAlreadyRegistered}
                className={styles.registerBtn}
              >
                {detailLoading
                  ? "Registering..."
                  : isAlreadyRegistered
                    ? "Registered"
                    : "Register Now"}
              </button>
            )}
            {isFull && (
              <button
                disabled
                className={styles.registerBtn}
                style={{ opacity: 0.5, cursor: "not-allowed" }}
              >
                Full
              </button>
            )}
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailsLeft}>
            <div className={styles.detailCard}>
              <h3>📋 Overview</h3>
              <div className={styles.cardContent}>
                <p className={styles.description}>
                  {training.description || "No description provided"}
                </p>
              </div>
            </div>

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

            <div className={styles.detailCard}>
              <h3>📍 Location</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>State</span>
                  <span className={styles.infoValue}>
                    {training.location?.state}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>District</span>
                  <span className={styles.infoValue}>
                    {training.location?.district}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>City</span>
                  <span className={styles.infoValue}>
                    {training.location?.city}
                  </span>
                </div>
              </div>
              <p className={styles.address}>{training.location?.address}</p>
            </div>

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

          <div className={styles.detailsRight}>
            {training.location?.latitude && training.location?.longitude && (
              <div className={styles.detailCard}>
                <h3>🗺️ Map</h3>
                <div className={styles.mapContainer}>
                  <MapContainer
                    center={[
                      training.location.latitude,
                      training.location.longitude,
                    ]}
                    zoom={13}
                    style={{
                      height: "500px",
                      width: "100%",
                      borderRadius: "8px",
                    }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[
                        training.location.latitude,
                        training.location.longitude,
                      ]}
                    >
                      <Popup>{training.title}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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

  return (
    <div className={styles.layout}>
      <Sidebar
        role="participant"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className={styles.main}>
        <header className={styles.topBar}>
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <FiMenu size={24} />
          </button>
          <h1 className={styles.title}>Training Details</h1>
        </header>
        <section className={styles.page}>
          {!selectedTrainingId && (
            <>
              {/* Search and Filter Section */}
              <div className={styles.filterSection}>
                <div className={styles.filtersRow}>
                  <div className={styles.searchBox}>
                    <label>Search by Title</label>
                    <input
                      type="text"
                      placeholder="Enter title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label>State</label>
                    <select
                      value={filters.state}
                      onChange={(e) =>
                        handleFilterChange("state", e.target.value)
                      }
                      className={styles.filterSelect}
                    >
                      <option value="">All States</option>
                      {getAvailableStates().map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label>Disaster Type</label>
                    <select
                      value={filters.theme}
                      onChange={(e) =>
                        handleFilterChange("theme", e.target.value)
                      }
                      className={styles.filterSelect}
                    >
                      <option value="">All Disaster Types</option>
                      {getAvailableThemes().map((theme) => (
                        <option key={theme} value={theme}>
                          {theme}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(searchTerm || filters.state || filters.theme) && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilters({ state: "", theme: "" });
                      }}
                      className={styles.clearBtn}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Results Count */}
              <div className={styles.resultsCount}>
                Found {filteredTrainings.length} training
                {filteredTrainings.length !== 1 ? "s" : ""}
              </div>

              {/* Trainings List */}
              <div className={styles.tableWrap}>
                {filteredTrainings.length === 0 ? (
                  <div className={styles.noResults}>
                    <p>No trainings found matching your criteria.</p>
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Theme</th>
                        <th>Location</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Trainer</th>
                        <th>Participants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrainings.map((item) => (
                        <tr
                          key={item._id}
                          className={`${styles.trainingRow} ${selectedTrainingId === item._id ? styles.trainingRowSelected : ""}`}
                          onClick={() => handleRowSelect(item)}
                          tabIndex={0}
                          role="button"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleRowSelect(item);
                            }
                          }}
                        >
                          <td className={styles.titleCell}>{item.title}</td>
                          <td>{item.theme}</td>
                          <td>
                            <div className={styles.location}>
                              {item.location?.district}, {item.location?.state}
                            </div>
                          </td>
                          <td>
                            {new Date(item.startDate).toLocaleDateString()}
                          </td>
                          <td>{new Date(item.endDate).toLocaleDateString()}</td>
                          <td>{item.trainerName || "-"}</td>
                          <td>
                            <span className={styles.participantCount}>
                              {item.registeredParticipants?.length || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {selectedTrainingId && (
            <div className={styles.trainingDetailSection}>
              <button
                onClick={handleBackToTrainings}
                className={styles.backBtn}
              >
                ← Back to Training Details
              </button>
              {renderTrainingDetailPanel()}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
