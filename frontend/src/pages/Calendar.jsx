import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import styles from "../styles/Calendar.module.css";
import { FiCalendar, FiMapPin, FiUsers, FiClock, FiX } from "react-icons/fi";
import { trainingAPI } from "../utils/api";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// Create custom blue marker icon with proper pin shape
const blueMarkerIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='50' viewBox='0 0 40 50'%3E%3Cpath d='M20 0C10.06 0 2 8.06 2 18c0 15 18 32 18 32s18-17 18-32c0-9.94-8.06-18-18-18zm0 26c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z' fill='%230472ff'/%3E%3Ccircle cx='20' cy='18' r='5' fill='white'/%3E%3C/svg%3E",
  iconSize: [40, 50],
  iconAnchor: [20, 50],
  popupAnchor: [0, -50],
});

function TrainingModal({ training, onClose }) {
  if (!training) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTimeRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startTime = start.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = end.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${startTime} - ${endTime}`;
  };

  return (
    <div
      className={styles["modal-overlay"]}
      onClick={onClose}
    >
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles["close-btn"]} onClick={onClose}>
          <FiX size={16} />
        </button>

        <div className={styles["modal-header"]}>
          <h2>{training.title}</h2>
          <span className={styles["modal-theme"]}>{training.theme}</span>
        </div>

        <div className={styles["modal-body"]}>
          {/* Map Section */}
          {training.location.latitude && training.location.longitude && (
            <div className={styles["modal-section"]}>
              <h3>Training Location</h3>
              <MapContainer
                center={[training.location.latitude, training.location.longitude]}
                zoom={15}
                className={styles["map-container"]}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker
                  position={[training.location.latitude, training.location.longitude]}
                  icon={blueMarkerIcon}
                >
                  <Popup>
                    <strong>{training.title}</strong>
                    <br />
                    {training.location.city}, {training.location.state}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          )}

          <div className={styles["modal-section"]}>
            <h3>Details</h3>
            <div className={styles["detail-item"]}>
              <FiCalendar className={styles["detail-icon"]} />
              <div>
                <strong>Date</strong>
                <p>{formatDate(training.startDate)}</p>
              </div>
            </div>

            <div className={styles["detail-item"]}>
              <FiClock className={styles["detail-icon"]} />
              <div>
                <strong>Time</strong>
                <p>{getTimeRange(training.startDate, training.endDate)}</p>
              </div>
            </div>

            <div className={styles["detail-item"]}>
              <FiMapPin className={styles["detail-icon"]} />
              <div>
                <strong>Location</strong>
                <p>
                  {training.location.city}, {training.location.district},{" "}
                  {training.location.state}
                </p>
                {training.location.address && (
                  <p className={styles["address"]}>{training.location.address}</p>
                )}
              </div>
            </div>

            <div className={styles["detail-item"]}>
              <FiUsers className={styles["detail-icon"]} />
              <div>
                <strong>Participants</strong>
                <p>{training.participantsCount} participants</p>
              </div>
            </div>
          </div>

          {training.description && (
            <div className={styles["modal-section"]}>
              <h3>Description</h3>
              <p>{training.description}</p>
            </div>
          )}

          <div className={styles["modal-section"]}>
            <h3>Trainer Information</h3>
            <div className={styles["detail-item"]}>
              <strong>Name:</strong>
              <p>{training.trainerName}</p>
            </div>
            <div className={styles["detail-item"]}>
              <strong>Email:</strong>
              <p>{training.trainerEmail}</p>
            </div>
          </div>

          {training.participantBreakdown &&
            (training.participantBreakdown.government > 0 ||
              training.participantBreakdown.ngo > 0 ||
              training.participantBreakdown.volunteers > 0) && (
              <div className={styles["modal-section"]}>
                <h3>Participant Breakdown</h3>
                <div className={styles["breakdown"]}>
                  {training.participantBreakdown.government > 0 && (
                    <div className={styles["breakdown-item"]}>
                      <span>Government:</span>
                      <strong>{training.participantBreakdown.government}</strong>
                    </div>
                  )}
                  {training.participantBreakdown.ngo > 0 && (
                    <div className={styles["breakdown-item"]}>
                      <span>NGO:</span>
                      <strong>{training.participantBreakdown.ngo}</strong>
                    </div>
                  )}
                  {training.participantBreakdown.volunteers > 0 && (
                    <div className={styles["breakdown-item"]}>
                      <span>Volunteers:</span>
                      <strong>{training.participantBreakdown.volunteers}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

          {training.photos && training.photos.length > 0 && (
            <div className={styles["modal-section"]}>
              <h3>Photos</h3>
              <div className={styles["photos-grid"]}>
                {training.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.url}
                    alt={`Training ${index + 1}`}
                    className={styles["training-photo"]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const themes = [
    "all",
    "Flood Management",
    "Cyclone Management",
    "Earthquake Safety",
    "First Aid",
    "Fire Safety",
    "Emergency Response",
  ];

  // Fetch trainings from database
  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        setLoading(true);
        const response = await trainingAPI.getAll({});
        console.log("Trainings response:", response.data);
        setTrainings(response.data.trainings || []);
      } catch (error) {
        console.error("Error fetching trainings:", error);
        setTrainings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, []);

  const filteredTrainings =
    selectedTheme === "all"
      ? trainings
      : trainings.filter((t) => t.theme === selectedTheme);

  const upcomingTrainings = filteredTrainings.sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );

  return (
    <div className={styles["wrapper"]}>
      <Navbar />

      {/* Modal */}
      <TrainingModal
        training={selectedTraining}
        onClose={() => setSelectedTraining(null)}
      />

      {/* Map Modal */}
      {showMapModal && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setShowMapModal(false)}
        >
          <div
            className={styles["map-modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles["close-btn"]}
              onClick={() => setShowMapModal(false)}
            >
              <FiX size={16} />
            </button>
            <h2 className={styles["map-modal-title"]}>All Training Locations</h2>
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              className={styles["full-map-container"]}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {trainings
                .filter(
                  (training) =>
                    training.location.latitude && training.location.longitude
                )
                .map((training) => (
                  <Marker
                    key={training._id}
                    position={[
                      training.location.latitude,
                      training.location.longitude,
                    ]}
                    icon={blueMarkerIcon}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <strong style={{ fontSize: '14px' }}>{training.title}</strong>
                        <br />
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {training.theme}
                        </span>
                        <br />
                        <span style={{ fontSize: '12px' }}>
                          {training.location.city}, {training.location.state}
                        </span>
                        <br />
                        <span style={{ fontSize: '12px', color: '#0472ff' }}>
                          {new Date(training.startDate).toLocaleDateString()}
                        </span>
                        <br />
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                          <FiUsers style={{ verticalAlign: 'middle', marginRight: '4px' }} size={14} />
                          {training.participantsCount || 0} Participants
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
        </div>
      )}

      <div className={styles["container"]}>
        <section className={styles["hero"]}>
          <h1 className={styles["title"]}>Training Calendar</h1>
          <p className={styles["subtitle"]}>
            Explore upcoming disaster management training programs across India
          </p>
        </section>

        <section className={styles["content"]}>
          {/* Filter Section */}
          <div className={styles["filters"]}>
            <h3 className={styles["filter-title"]}>Filter by Theme</h3>
            <div className={styles["filter-buttons"]}>
              {themes.map((theme) => (
                <button
                  key={theme}
                  className={`${styles["filter-btn"]} ${
                    selectedTheme === theme ? styles["active"] : ""
                  }`}
                  onClick={() => setSelectedTheme(theme)}
                >
                  {theme === "all" ? "All Themes" : theme}
                </button>
              ))}
              <button
                className={`${styles["filter-btn"]} ${styles["map-btn"]}`}
                onClick={() => setShowMapModal(true)}
              >
                <FiMapPin style={{ marginRight: '6px' }} />
                Map
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className={styles["loading"]}>
              <p>Loading trainings...</p>
            </div>
          )}

          {/* Trainings Grid */}
          {!loading && (
            <div className={styles["trainings-grid"]}>
              {upcomingTrainings.map((training) => (
                <div key={training._id} className={styles["training-card"]}>
                  <div className={styles["card-header"]}>
                    <div className={styles["date-badge"]}>
                      {new Date(training.startDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </div>
                    <span className={styles["theme-tag"]}>{training.theme}</span>
                  </div>

                  <div className={styles["card-content"]}>
                    <h3 className={styles["training-title"]}>
                      {training.title}
                    </h3>

                    <div className={styles["training-details"]}>
                      <div className={styles["detail"]}>
                        <FiCalendar className={styles["detail-icon"]} />
                        <span>
                          {new Date(training.startDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>

                      <div className={styles["detail"]}>
                        <FiClock className={styles["detail-icon"]} />
                        <span>
                          {new Date(training.startDate).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}{" "}
                          -{" "}
                          {new Date(training.endDate).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>

                      <div className={styles["detail"]}>
                        <FiMapPin className={styles["detail-icon"]} />
                        <span>
                          {training.location.city}, {training.location.state}
                        </span>
                      </div>

                      <div className={styles["detail"]}>
                        <FiUsers className={styles["detail-icon"]} />
                        <span>~{training.participantsCount} Participants</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles["card-footer"]}>
                    <button
                      className={styles["details-btn"]}
                      onClick={() => setSelectedTraining(training)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && upcomingTrainings.length === 0 && (
            <div className={styles["no-results"]}>
              <p>No trainings found for the selected theme.</p>
            </div>
          )}
        </section>

        {/* Statistics Section */}
        <section className={styles["stats-section"]}>
          <h2>Training Statistics</h2>
          <div className={styles["stats-grid"]}>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-number"]}>
                {upcomingTrainings.length}
              </div>
              <div className={styles["stat-label"]}>Upcoming Trainings</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-number"]}>
                {upcomingTrainings.reduce(
                  (sum, t) => sum + t.participantsCount,
                  0
                )}
              </div>
              <div className={styles["stat-label"]}>Total Participants</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-number"]}>
                {new Set(upcomingTrainings.map((t) => t.location.state)).size}
              </div>
              <div className={styles["stat-label"]}>States Covered</div>
            </div>
            <div className={styles["stat-card"]}>
              <div className={styles["stat-number"]}>{themes.length - 1}</div>
              <div className={styles["stat-label"]}>Training Themes</div>
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
  );}