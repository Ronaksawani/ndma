import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { analyticsAPI, partnerAPI, trainingAPI } from "../utils/api";
import Sidebar from "../components/Sidebar";
import { generateRecommendations } from "../utils/generateRecommendations";
import { getColor, getDisasterFromTheme } from "../utils/recommendationEngine";
import styles from "../styles/AdminDashboard.module.css";
import { FiBarChart2, FiUsers, FiMapPin, FiBell } from "react-icons/fi";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTrainings: 0,
    totalParticipants: 0,
    statesCovered: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [trainingLocations, setTrainingLocations] = useState([]);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActivitiesPanel, setShowActivitiesPanel] = useState(false);

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

  const recommendationInputs = useMemo(
    () =>
      trainingHistory
        .map((training) => ({
          district: training.location?.district,
          disaster: getDisasterFromTheme(training.theme),
          date: training.startDate,
        }))
        .filter((training) => training.district && training.disaster),
    [trainingHistory],
  );

  const recommendations = useMemo(
    () => generateRecommendations(recommendationInputs),
    [recommendationInputs],
  );

  const recommendationLookup = useMemo(() => {
    const lookup = new Map();

    recommendations.forEach((item) => {
      lookup.set(item.key, item);
    });

    return lookup;
  }, [recommendations]);

  const priorityRecommendations = useMemo(
    () =>
      recommendations
        .filter((item) => item.priority !== "Low")
        .sort((a, b) => b.score - a.score)
        .slice(0, 6),
    [recommendations],
  );

  const recommendationCounts = useMemo(
    () => ({
      high: recommendations.filter((item) => item.priority === "High").length,
      medium: recommendations.filter((item) => item.priority === "Medium")
        .length,
      low: recommendations.filter((item) => item.priority === "Low").length,
    }),
    [recommendations],
  );

  const mappableLocations = useMemo(
    () =>
      filteredLocations
        .map((location) => ({
          ...location,
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
        }))
        .filter(
          (location) =>
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude),
        ),
    [filteredLocations],
  );

  const getLocationRecommendation = (location) => {
    const disaster = getDisasterFromTheme(location.theme);

    if (!disaster) {
      return null;
    }

    return recommendationLookup.get(
      [location.state || "", location.district || "", disaster].join("::"),
    );
  };

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

      const [dashboardRes, locationsRes, trainingsRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getTrainingLocations(),
        trainingAPI.getAll({ limit: 1000 }),
      ]);

      setStats({
        totalTrainings: dashboardRes.data.stats.totalTrainings,
        totalParticipants: dashboardRes.data.stats.totalParticipants,
        statesCovered: dashboardRes.data.stats.statesCovered,
      });
      setTrainingHistory(trainingsRes.data.trainings || []);
      setTrainingLocations(locationsRes.data || []);

      // Combine training activities with pending partner requests
      const activities = dashboardRes.data.recentActivities.map((training) => ({
        id: training._id,
        title: training.title,
        type: "Training",
        timestamp: new Date(training.createdAt),
        partner: training.partnerId?.organizationName || "Unknown",
      }));

      // Fetch pending partner requests
      try {
        const partnersRes = await partnerAPI.getAll({ status: "pending" });
        const pendingPartners = partnersRes.data.partners || [];

        const pendingActivities = pendingPartners.map((partner) => ({
          id: partner._id,
          title: `New Partner Request: ${partner.organizationName}`,
          type: "Partner Request",
          timestamp: new Date(partner.createdAt),
          partner: partner.organizationName,
        }));

        // Combine and sort by timestamp (newest first)
        const allActivities = [...activities, ...pendingActivities].sort(
          (a, b) => b.timestamp - a.timestamp,
        );

        setRecentActivities(allActivities);
      } catch (err) {
        console.error("Error fetching pending partners:", err);
        setRecentActivities(activities);
      }
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
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.notificationButton}
              title="Recent activities"
              onClick={() => setShowActivitiesPanel((prev) => !prev)}
            >
              <FiBell />
              {recentActivities.length > 0 && (
                <span className={styles.notificationCount}>
                  {Math.min(recentActivities.length, 9)}
                </span>
              )}
              <span className={styles.notificationTooltip}>
                Recent Activities
              </span>
            </button>
          </div>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.recommendationSection}>
          <div className={styles.recommendationHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Priority engine</p>
              <h3>Disaster response recommendations</h3>
            </div>
            <div className={styles.recommendationCounters}>
              <span className={styles.priorityChipHigh}>
                High {recommendationCounts.high}
              </span>
              <span className={styles.priorityChipMedium}>
                Medium {recommendationCounts.medium}
              </span>
              <span className={styles.priorityChipLow}>
                Low {recommendationCounts.low}
              </span>
            </div>
          </div>

          <div className={styles.recommendationGrid}>
            {priorityRecommendations.length > 0 ? (
              priorityRecommendations.map((item) => (
                <div key={item.key} className={styles.recommendationCard}>
                  <div className={styles.recommendationCardHeader}>
                    <div>
                      <p className={styles.recommendationLocation}>
                        {item.district}, {item.state}
                      </p>
                      <h4>{item.recommendation}</h4>
                    </div>
                    <span
                      className={`${styles.priorityBadge} ${styles[`priority${item.priority}`]}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className={styles.recommendationMeta}>
                    {item.disaster} risk • score {item.score.toFixed(1)}
                  </p>
                </div>
              ))
            ) : (
              <div className={styles.recommendationEmpty}>
                No high-priority recommendations yet.
              </div>
            )}
          </div>
        </div>

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
                  <span className={`${styles.legendDot} ${styles.high}`}></span>
                  <span>High</span>
                </div>
                <div className={styles.legendItem}>
                  <span
                    className={`${styles.legendDot} ${styles.medium}`}
                  ></span>
                  <span>Medium</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.low}`}></span>
                  <span>Low</span>
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
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
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
                  {[
                    ...new Set(
                      trainingLocations.map((loc) => loc.state).filter(Boolean),
                    ),
                  ].map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
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

            <div className={styles.mapStage}>
              <MapContainer
                center={[20.5937, 78.9629]}
                zoom={4}
                className={styles.mapContainer}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {mappableLocations.map((location) => {
                  const recommendation = getLocationRecommendation(location);
                  const priority = recommendation?.priority || "Low";

                  return (
                    <CircleMarker
                      key={location.id}
                      center={[location.latitude, location.longitude]}
                      radius={9}
                      pathOptions={{
                        fillColor: getColor(priority),
                        color: "#ffffff",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.85,
                      }}
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
                          <p>
                            <strong>Priority:</strong>{" "}
                            <span
                              className={`${styles.priorityBadge} ${styles[`priority${priority}`]}`}
                            >
                              {priority}
                            </span>
                          </p>
                          {recommendation && (
                            <p>
                              <strong>Recommendation:</strong>{" "}
                              {recommendation.recommendation}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>

              {mappableLocations.length === 0 && (
                <div className={styles.noDataOverlay}>
                  <p>No training locations with coordinates available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {showActivitiesPanel && (
          <button
            type="button"
            className={styles.panelBackdrop}
            aria-label="Close recent activities"
            onClick={() => setShowActivitiesPanel(false)}
          />
        )}

        <aside
          className={`${styles.activitiesDrawer} ${showActivitiesPanel ? styles.activitiesDrawerOpen : ""}`}
          aria-hidden={!showActivitiesPanel}
        >
          <div className={styles.activitiesHeader}>
            <h3>
              <FiBell /> Recent Activities
            </h3>
            <button
              type="button"
              className={styles.closeDrawerButton}
              onClick={() => setShowActivitiesPanel(false)}
              aria-label="Close panel"
            >
              x
            </button>
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
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboard;
