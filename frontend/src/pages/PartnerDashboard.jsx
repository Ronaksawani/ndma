import React, { useState, useEffect } from "react";
import { FiBarChart2, FiCheck, FiClock } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { trainingAPI } from "../utils/api";
import styles from "../styles/Dashboard.module.css";

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
  });
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await trainingAPI.getAll({ partnerId: user?.id });
      const data = response.data.trainings || [];
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
            <div className="stats-card">
              <div className={styles["stats-icon"]}>
                <FiBarChart2 size={28} />
              </div>
              <div className={styles["stats-number"]}>{stats.total}</div>
              <div className={styles["stats-label"]}>My Total Trainings</div>
            </div>
            <div className="stats-card">
              <div className={styles["stats-icon"]}>
                <FiClock size={28} />
              </div>
              <div className={styles["stats-number"]}>{stats.pending}</div>
              <div className={styles["stats-label"]}>Pending Approval</div>
            </div>
            <div className="stats-card">
              <div className={styles["stats-icon"]}>
                <FiCheck size={28} />
              </div>
              <div className={styles["stats-number"]}>{stats.approved}</div>
              <div className={styles["stats-label"]}>Approved</div>
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
