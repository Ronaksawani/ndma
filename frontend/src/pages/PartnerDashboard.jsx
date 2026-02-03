import React, { useState, useEffect } from "react";
import { FiBarChart2, FiCheck, FiClock, FiFilter, FiMap } from "react-icons/fi";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { trainingAPI } from "../utils/api";
import styles from "../styles/Dashboard.module.css";

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

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
  });
  const [trainings, setTrainings] = useState([]);
  const [allTrainings, setAllTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    theme: "all",
    search: "",
  });

  const themes = [
    "Flood Management",
    "Earthquake Safety",
    "Cyclone Management",
    "First Aid",
    "Fire Safety",
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#10b981"; // green
      case "pending":
        return "#f59e0b"; // orange
      case "rejected":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await trainingAPI.getAll({ partnerId: user?.id });
      const data = response.data.trainings || [];
      setAllTrainings(data);
      setTrainings(data.slice(0, 5)); // Recent submissions
      setStats({
        total: data.length,
        pending: data.filter((t) => t.status === "pending").length,
        approved: data.filter((t) => t.status === "approved").length,
      });
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrainings = allTrainings.filter((training) => {
    const matchesStatus =
      filters.status === "all" || training.status === filters.status;
    const matchesTheme =
      filters.theme === "all" || training.theme === filters.theme;
    const matchesSearch =
      filters.search === "" ||
      training.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      training.location?.district
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      training.location?.state
        ?.toLowerCase()
        .includes(filters.search.toLowerCase());
    return matchesStatus && matchesTheme && matchesSearch;
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="layout-container">
      <Sidebar role="partner" />
      <div className="main-content">
        <div className="top-nav">
          <h2 className="nav-title">
            Partner Dashboard - {user?.organizationName}
          </h2>
          <div className="nav-right">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.contactPerson?.[0]?.toUpperCase()}
              </div>
              <span>{user?.contactPerson}</span>
            </div>
          </div>
        </div>

        <div className="page-content">
          {/* Stats Cards */}
          <div className={styles["dashboard-stats"]}>
            <div className={styles["stat-card-new"]}>
              <div
                className={styles["stat-icon-new"]}
                style={{ backgroundColor: "#dbeafe" }}
              >
                <FiBarChart2 size={24} color="#1e40af" />
              </div>
              <div className={styles["stat-content-new"]}>
                <div className={styles["stat-number-new"]}>{stats.total}</div>
                <div className={styles["stat-label-new"]}>Total Trainings</div>
              </div>
            </div>
            <div className={styles["stat-card-new"]}>
              <div
                className={styles["stat-icon-new"]}
                style={{ backgroundColor: "#dcfce7" }}
              >
                <FiCheck size={24} color="#15803d" />
              </div>
              <div className={styles["stat-content-new"]}>
                <div className={styles["stat-number-new"]}>
                  {stats.approved}
                </div>
                <div className={styles["stat-label-new"]}>Approved</div>
              </div>
            </div>
            <div className={styles["stat-card-new"]}>
              <div
                className={styles["stat-icon-new"]}
                style={{ backgroundColor: "#fef3c7" }}
              >
                <FiClock size={24} color="#a16207" />
              </div>
              <div className={styles["stat-content-new"]}>
                <div className={styles["stat-number-new"]}>{stats.pending}</div>
                <div className={styles["stat-label-new"]}>Pending</div>
              </div>
            </div>
            <div className={styles["stat-card-new"]}>
              <div
                className={styles["stat-icon-new"]}
                style={{ backgroundColor: "#fee2e2" }}
              >
                <FiBarChart2 size={24} color="#991b1b" />
              </div>
              <div className={styles["stat-content-new"]}>
                <div className={styles["stat-number-new"]}>
                  {allTrainings.filter((t) => t.status === "rejected").length}
                </div>
                <div className={styles["stat-label-new"]}>Rejected</div>
              </div>
            </div>
          </div>

          {/* Map Section with Filters */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <div className={styles["map-header"]}>
              <div className={styles["map-title"]}>
                <FiMap size={20} style={{ marginRight: "8px" }} />
                <h3>Training Locations Map</h3>
              </div>
              <div className={styles["map-legend"]}>
                <div className={styles["legend-item"]}>
                  <span
                    className={styles["legend-dot"]}
                    style={{ backgroundColor: "#10b981" }}
                  ></span>
                  Approved
                </div>
                <div className={styles["legend-item"]}>
                  <span
                    className={styles["legend-dot"]}
                    style={{ backgroundColor: "#f59e0b" }}
                  ></span>
                  Pending
                </div>
                <div className={styles["legend-item"]}>
                  <span
                    className={styles["legend-dot"]}
                    style={{ backgroundColor: "#ef4444" }}
                  ></span>
                  Rejected
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className={styles["map-filters"]}>
              <div className={styles["filter-group"]}>
                <FiFilter size={16} />
                <span className={styles["filter-label"]}>Filters:</span>
              </div>
              <div className={styles["filter-group"]}>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className={styles["filter-select"]}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className={styles["filter-group"]}>
                <select
                  value={filters.theme}
                  onChange={(e) => handleFilterChange("theme", e.target.value)}
                  className={styles["filter-select"]}
                >
                  <option value="all">All Themes</option>
                  {themes.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles["filter-group"]}>
                <input
                  type="text"
                  placeholder="Search by title or location..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className={styles["filter-search"]}
                />
              </div>
              <div className={styles["filter-count"]}>
                Showing {filteredTrainings.length} of {allTrainings.length}{" "}
                trainings
              </div>
            </div>

            {/* Map */}
            <div className={styles["map-container"]}>
              {loading ? (
                <div className={styles["map-loading"]}>
                  <div className="spinner"></div>
                  <p>Loading map...</p>
                </div>
              ) : filteredTrainings.filter(
                  (t) => t.location?.latitude && t.location?.longitude,
                ).length === 0 ? (
                <div className={styles["map-empty"]}>
                  <FiMap size={48} />
                  <p>No trainings with location data</p>
                </div>
              ) : (
                <MapContainer
                  center={[20.5937, 78.9629]}
                  zoom={5}
                  style={{
                    height: "500px",
                    width: "100%",
                    borderRadius: "8px",
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredTrainings.map((training) => {
                    if (
                      !training.location?.latitude ||
                      !training.location?.longitude
                    )
                      return null;
                    return (
                      <CircleMarker
                        key={training._id}
                        center={[
                          training.location.latitude,
                          training.location.longitude,
                        ]}
                        radius={8}
                        fillColor={getStatusColor(training.status)}
                        color="#fff"
                        weight={2}
                        opacity={1}
                        fillOpacity={0.8}
                      >
                        <Popup>
                          <div style={{ minWidth: "200px" }}>
                            <h4
                              style={{
                                marginBottom: "8px",
                                fontSize: "14px",
                                fontWeight: "600",
                              }}
                            >
                              {training.title}
                            </h4>
                            <div
                              style={{ fontSize: "12px", marginBottom: "4px" }}
                            >
                              <strong>Theme:</strong> {training.theme}
                            </div>
                            <div
                              style={{ fontSize: "12px", marginBottom: "4px" }}
                            >
                              <strong>Location:</strong>{" "}
                              {training.location?.city},{" "}
                              {training.location?.district},{" "}
                              {training.location?.state}
                            </div>
                            <div
                              style={{ fontSize: "12px", marginBottom: "4px" }}
                            >
                              <strong>Date:</strong>{" "}
                              {new Date(
                                training.startDate,
                              ).toLocaleDateString()}
                            </div>
                            <div
                              style={{ fontSize: "12px", marginBottom: "4px" }}
                            >
                              <strong>Participants:</strong>{" "}
                              {training.participantsCount}
                            </div>
                            <div style={{ fontSize: "12px", marginTop: "8px" }}>
                              <span
                                className={`badge badge-${training.status}`}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                }}
                              >
                                {training.status}
                              </span>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              )}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="card">
            <h3 className="card-header">Recent Submissions</h3>
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : trainings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>No trainings submitted yet</p>
              </div>
            ) : (
              <div className={styles["dashboard-table"]}>
                <table>
                  <thead>
                    <tr>
                      <th>Training Title</th>
                      <th>Theme</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Participants</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainings.map((training) => (
                      <tr key={training._id}>
                        <td>{training.title}</td>
                        <td>{training.theme}</td>
                        <td>
                          {new Date(training.startDate).toLocaleDateString()}
                        </td>
                        <td>
                          {training.location?.district},{" "}
                          {training.location?.state}
                        </td>
                        <td>{training.participantsCount}</td>
                        <td>
                          <span className={`badge badge-${training.status}`}>
                            {training.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
