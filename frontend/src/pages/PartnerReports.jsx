import React, { useState, useEffect } from "react";
import {
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiDownload,
  FiFilter,
  FiPieChart,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { trainingAPI } from "../utils/api";
import styles from "../styles/Reports.module.css";

export default function PartnerReports() {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [selectedTheme, setSelectedTheme] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await trainingAPI.getAll({ partnerId: user?.id });
      const data = response.data.trainings || [];
      setTrainings(data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter trainings based on date range
  const filterByDate = (training) => {
    if (dateRange === "all") return true;
    const trainingDate = new Date(training.startDate);
    const now = new Date();
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
    const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));

    switch (dateRange) {
      case "month":
        return trainingDate >= monthAgo;
      case "quarter":
        return trainingDate >= threeMonthsAgo;
      case "year":
        return trainingDate >= yearAgo;
      default:
        return true;
    }
  };

  const filteredTrainings = trainings.filter((t) => {
    const matchesDate = filterByDate(t);
    const matchesTheme = selectedTheme === "all" || t.theme === selectedTheme;
    return matchesDate && matchesTheme;
  });

  // Calculate statistics
  const stats = {
    total: filteredTrainings.length,
    approved: filteredTrainings.filter((t) => t.status === "approved").length,
    pending: filteredTrainings.filter((t) => t.status === "pending").length,
    rejected: filteredTrainings.filter((t) => t.status === "rejected").length,
    totalParticipants: filteredTrainings.reduce(
      (sum, t) => sum + (t.participantsCount || 0),
      0,
    ),
    avgParticipants:
      filteredTrainings.length > 0
        ? Math.round(
            filteredTrainings.reduce(
              (sum, t) => sum + (t.participantsCount || 0),
              0,
            ) / filteredTrainings.length,
          )
        : 0,
  };

  // Theme-wise breakdown
  const themeBreakdown = filteredTrainings.reduce((acc, training) => {
    const theme = training.theme || "Unknown";
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {});

  // Status-wise breakdown
  const statusBreakdown = {
    approved: stats.approved,
    pending: stats.pending,
    rejected: stats.rejected,
  };

  // Monthly trend data (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthYear = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const count = filteredTrainings.filter((t) => {
      const tDate = new Date(t.startDate);
      return (
        tDate.getMonth() === date.getMonth() &&
        tDate.getFullYear() === date.getFullYear()
      );
    }).length;
    monthlyTrend.push({ month: monthYear, count });
  }

  // State-wise distribution
  const stateDistribution = filteredTrainings.reduce((acc, training) => {
    const state = training.location?.state || "Unknown";
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  const themes = [
    "Flood Management",
    "Earthquake Safety",
    "Cyclone Management",
    "First Aid",
    "Fire Safety",
  ];

  const handleExport = () => {
    // Create CSV data
    const headers = [
      "Title",
      "Theme",
      "Start Date",
      "Location",
      "Participants",
      "Status",
    ];
    const rows = filteredTrainings.map((t) => [
      t.title,
      t.theme,
      new Date(t.startDate).toLocaleDateString(),
      `${t.location?.district}, ${t.location?.state}`,
      t.participantsCount,
      t.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const maxThemeCount = Math.max(...Object.values(themeBreakdown), 1);
  const maxStateCount = Math.max(...Object.values(stateDistribution), 1);
  const maxMonthlyCount = Math.max(...monthlyTrend.map((m) => m.count), 1);

  return (
    <div className="layout-container">
      <Sidebar role="partner" />
      <div className="main-content">
        <div className="top-nav">
          <h2 className="nav-title">Reports & Analytics</h2>
          <div className="nav-right">
            <button className={styles["export-btn"]} onClick={handleExport}>
              <FiDownload size={16} />
              Export as Excel
            </button>
          </div>
        </div>

        <div className="page-content">
          {/* Filters */}
          <div className={styles["filter-section"]}>
            <div className={styles["filter-group"]}>
              <FiFilter size={16} />
              <span className={styles["filter-label"]}>Filters:</span>
            </div>
            <div className={styles["filter-group"]}>
              <label>Time Period:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={styles["filter-select"]}
              >
                <option value="all">All Time</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div className={styles["filter-group"]}>
              <label>Theme:</label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
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
          </div>

          {/* Summary Stats */}
          <div className={styles["stats-grid"]}>
            <div className={styles["stat-card"]}>
              <div
                className={styles["stat-icon"]}
                style={{ backgroundColor: "#dbeafe" }}
              >
                <FiBarChart2 size={24} color="#1e40af" />
              </div>
              <div className={styles["stat-content"]}>
                <div className={styles["stat-value"]}>{stats.total}</div>
                <div className={styles["stat-label"]}>Total Trainings</div>
              </div>
            </div>
            <div className={styles["stat-card"]}>
              <div
                className={styles["stat-icon"]}
                style={{ backgroundColor: "#dcfce7" }}
              >
                <FiTrendingUp size={24} color="#15803d" />
              </div>
              <div className={styles["stat-content"]}>
                <div className={styles["stat-value"]}>{stats.approved}</div>
                <div className={styles["stat-label"]}>Approved</div>
              </div>
            </div>
            <div className={styles["stat-card"]}>
              <div
                className={styles["stat-icon"]}
                style={{ backgroundColor: "#fef3c7" }}
              >
                <FiCalendar size={24} color="#a16207" />
              </div>
              <div className={styles["stat-content"]}>
                <div className={styles["stat-value"]}>{stats.pending}</div>
                <div className={styles["stat-label"]}>Pending</div>
              </div>
            </div>
            <div className={styles["stat-card"]}>
              <div
                className={styles["stat-icon"]}
                style={{ backgroundColor: "#e0e7ff" }}
              >
                <FiUsers size={24} color="#4338ca" />
              </div>
              <div className={styles["stat-content"]}>
                <div className={styles["stat-value"]}>
                  {stats.totalParticipants.toLocaleString()}
                </div>
                <div className={styles["stat-label"]}>Total Participants</div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className={styles["charts-grid"]}>
            {/* Monthly Trend */}
            <div className="card">
              <h3 className={styles["chart-title"]}>
                <FiTrendingUp size={18} />
                Training Trend (Last 6 Months)
              </h3>
              <div className={styles["bar-chart"]}>
                {monthlyTrend.map((item, idx) => (
                  <div key={idx} className={styles["bar-item"]}>
                    <div className={styles["bar-wrapper"]}>
                      <div
                        className={styles["bar"]}
                        style={{
                          height: `${(item.count / maxMonthlyCount) * 200}px`,
                        }}
                      >
                        <span className={styles["bar-value"]}>
                          {item.count}
                        </span>
                      </div>
                    </div>
                    <div className={styles["bar-label"]}>{item.month}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme Distribution */}
            <div className="card">
              <h3 className={styles["chart-title"]}>
                <FiPieChart size={18} />
                Theme Distribution
              </h3>
              <div className={styles["horizontal-bar-chart"]}>
                {Object.entries(themeBreakdown).map(([theme, count]) => (
                  <div key={theme} className={styles["h-bar-item"]}>
                    <div className={styles["h-bar-label"]}>{theme}</div>
                    <div className={styles["h-bar-wrapper"]}>
                      <div
                        className={styles["h-bar"]}
                        style={{
                          width: `${(count / maxThemeCount) * 100}%`,
                        }}
                      ></div>
                      <span className={styles["h-bar-value"]}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="card">
              <h3 className={styles["chart-title"]}>
                <FiBarChart2 size={18} />
                Status Breakdown
              </h3>
              <div className={styles["donut-chart"]}>
                <div className={styles["donut-items"]}>
                  <div className={styles["donut-item"]}>
                    <div
                      className={styles["donut-dot"]}
                      style={{ backgroundColor: "#10b981" }}
                    ></div>
                    <div className={styles["donut-info"]}>
                      <span className={styles["donut-label"]}>Approved</span>
                      <span className={styles["donut-value"]}>
                        {stats.approved} (
                        {stats.total > 0
                          ? Math.round((stats.approved / stats.total) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>
                  <div className={styles["donut-item"]}>
                    <div
                      className={styles["donut-dot"]}
                      style={{ backgroundColor: "#f59e0b" }}
                    ></div>
                    <div className={styles["donut-info"]}>
                      <span className={styles["donut-label"]}>Pending</span>
                      <span className={styles["donut-value"]}>
                        {stats.pending} (
                        {stats.total > 0
                          ? Math.round((stats.pending / stats.total) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>
                  <div className={styles["donut-item"]}>
                    <div
                      className={styles["donut-dot"]}
                      style={{ backgroundColor: "#ef4444" }}
                    ></div>
                    <div className={styles["donut-info"]}>
                      <span className={styles["donut-label"]}>Rejected</span>
                      <span className={styles["donut-value"]}>
                        {stats.rejected} (
                        {stats.total > 0
                          ? Math.round((stats.rejected / stats.total) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles["donut-summary"]}>
                  <div className={styles["donut-total"]}>{stats.total}</div>
                  <div className={styles["donut-total-label"]}>Total</div>
                </div>
              </div>
            </div>

            {/* State Distribution */}
            <div className="card">
              <h3 className={styles["chart-title"]}>
                <FiBarChart2 size={18} />
                State-wise Distribution
              </h3>
              <div className={styles["horizontal-bar-chart"]}>
                {Object.entries(stateDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([state, count]) => (
                    <div key={state} className={styles["h-bar-item"]}>
                      <div className={styles["h-bar-label"]}>{state}</div>
                      <div className={styles["h-bar-wrapper"]}>
                        <div
                          className={styles["h-bar"]}
                          style={{
                            width: `${(count / maxStateCount) * 100}%`,
                          }}
                        ></div>
                        <span className={styles["h-bar-value"]}>{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="card">
            <h3 className="card-header">Key Metrics Summary</h3>
            <div className={styles["metrics-table"]}>
              <div className={styles["metric-row"]}>
                <div className={styles["metric-label"]}>
                  Total Trainings Conducted
                </div>
                <div className={styles["metric-value"]}>{stats.total}</div>
              </div>
              <div className={styles["metric-row"]}>
                <div className={styles["metric-label"]}>
                  Total Participants Trained
                </div>
                <div className={styles["metric-value"]}>
                  {stats.totalParticipants.toLocaleString()}
                </div>
              </div>
              <div className={styles["metric-row"]}>
                <div className={styles["metric-label"]}>
                  Average Participants per Training
                </div>
                <div className={styles["metric-value"]}>
                  {stats.avgParticipants}
                </div>
              </div>
              <div className={styles["metric-row"]}>
                <div className={styles["metric-label"]}>Approval Rate</div>
                <div className={styles["metric-value"]}>
                  {stats.total > 0
                    ? Math.round((stats.approved / stats.total) * 100)
                    : 0}
                  %
                </div>
              </div>
              <div className={styles["metric-row"]}>
                <div className={styles["metric-label"]}>Most Popular Theme</div>
                <div className={styles["metric-value"]}>
                  {Object.keys(themeBreakdown).length > 0
                    ? Object.entries(themeBreakdown).sort(
                        (a, b) => b[1] - a[1],
                      )[0][0]
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
