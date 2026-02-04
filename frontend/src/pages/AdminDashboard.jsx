import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { analyticsAPI } from "../utils/api";
import Sidebar from "../components/Sidebar";
import styles from "../styles/AdminDashboard.module.css";
import { FiBarChart2, FiUsers, FiMapPin, FiBell } from "react-icons/fi";

// Fix for Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const plannedIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const completedIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTrainings: 0,
    totalParticipants: 0,
    statesCovered: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [trainingLocations, setTrainingLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    state: "all",
    theme: "all",
  });

  const themes = [
    "Flood Management",
    "Earthquake Safety",
    "Cyclone Management",
    "First Aid",
    "Fire Safety",
    "Landslide Management",
    "Tsunami Awareness",
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Apply filters to locations
  useEffect(() => {
    let filtered = trainingLocations;

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter((loc) => loc.status === filters.status);
    }

    // Filter by state
    if (filters.state !== "all") {
      filtered = filtered.filter((loc) => loc.state === filters.state);
    }

    // Filter by theme
    if (filters.theme !== "all") {
      filtered = filtered.filter((loc) => loc.theme === filters.theme);
    }

    setFilteredLocations(filtered);
  }, [trainingLocations, filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard statistics
      const dashboardRes = await analyticsAPI.getDashboard();
      setStats({
        totalTrainings: dashboardRes.data.stats.totalTrainings,
        totalParticipants: dashboardRes.data.stats.totalParticipants,
        statesCovered: dashboardRes.data.stats.statesCovered,
      });

      // Transform recent activities
      const activities = dashboardRes.data.recentActivities.map((training) => ({
        id: training._id,
        title: training.title,
        type: "Training",
        timestamp: new Date(training.createdAt),
        partner: training.partnerId?.organizationName || "Unknown",
      }));
      setRecentActivities(activities);

      // Fetch training locations for map
      const locationsRes = await analyticsAPI.getTrainingLocations();
      setTrainingLocations(locationsRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.adminLayout}>
        <Sidebar role="admin" />
        <div className={styles.dashboardContainer}>
          <div className={styles.loadingState}>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <Sidebar role="admin" />
      <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1>NDMA Admin Dashboard</h1>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiBarChart2 />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Trainings</p>
            <h2 className={styles.statValue}>{stats.totalTrainings}</h2>
          </div>
          <div className={styles.chart}>
            <div className={styles.barChart}>
              <div className={styles.bar} style={{ height: "40%" }}></div>
              <div className={styles.bar} style={{ height: "60%" }}></div>
              <div className={styles.bar} style={{ height: "80%" }}></div>
              <div className={styles.bar} style={{ height: "50%" }}></div>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiUsers />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Volunteer Trained</p>
            <h2 className={styles.statValue}>
              {(stats.totalParticipants / 1000).toFixed(1)}K+
            </h2>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FiMapPin />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>States Covered</p>
            <h2 className={styles.statValue}>{stats.statesCovered}</h2>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Map Section */}
        <div className={styles.mapSection}>
          <div className={styles.mapHeader}>
            <h3>Training Locations</h3>
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.planned}`}></span>
                <span>Planned</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.completed}`}></span>
                <span>Completed</span>
              </div>
            </div>
          </div>

          {/* Map Filters */}
          <div className={styles.mapFilters}>
            <div className={styles.filterGroup}>
              <label>Status:</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="all">All Status</option>
                <option value="approved">Completed</option>
                <option value="pending">Planned</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>State:</label>
              <select
                value={filters.state}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, state: e.target.value }))
                }
              >
                <option value="all">All States</option>
                {[...new Set(trainingLocations.map((loc) => loc.state).filter(Boolean))].map(
                  (state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Theme:</label>
              <select
                value={filters.theme}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, theme: e.target.value }))
                }
              >
                <option value="all">All Themes</option>
                {themes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredLocations.length > 0 ? (
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={4}
              className={styles.mapContainer}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {filteredLocations.map((location) => (
                <Marker
                  key={location.id}
                  position={[location.latitude, location.longitude]}
                  icon={
                    location.status === "approved"
                      ? completedIcon
                      : plannedIcon
                  }
                >
                  <Popup>
                    <div className={styles.popupContent}>
                      <h4>{location.title}</h4>
                      <p>
                        <strong>Location:</strong> {location.city},{" "}
                        {location.state}
                      </p>
                      <p>
                        <strong>Partner:</strong> {location.partnerName}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(location.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className={styles.noDataMessage}>
              <p>No training locations available</p>
            </div>
          )}
        </div>

        {/* Recent Activities Section */}
        <div className={styles.activitiesSection}>
          <div className={styles.activitiesHeader}>
            <h3>
              <FiBell /> Recent Activities
            </h3>
          </div>

          <div className={styles.activitiesList}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityDot}></div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityTitle}>{activity.title}</p>
                    <p className={styles.activityMeta}>{activity.partner}</p>
                  </div>
                  <p className={styles.activityTime}>
                    {getTimeAgo(activity.timestamp)}
                  </p>
                </div>
              ))
            ) : (
              <p className={styles.noActivities}>No recent activities</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
