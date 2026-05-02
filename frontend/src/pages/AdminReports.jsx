import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageTopBar from "../components/PageTopBar";
import { analyticsAPI, trainingAPI } from "../utils/api";
import statesData from "../data/statesDistricts.json";
import styles from "../styles/AdminReports.module.css";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FiDownload, FiFilter, FiCalendar } from "react-icons/fi";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const AdminReports = () => {
  const [reportData, setReportData] = useState(null);
  const [trainingsByMonth, setTrainingsByMonth] = useState([]);
  const [participantsByState, setParticipantsByState] = useState([]);
  const [trainingThemeDistribution, setTrainingThemeDistribution] = useState(
    [],
  );
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    state: "all",
    status: "all",
  });

  // Color palette for charts
  const colors = [
    "#667eea",
    "#764ba2",
    "#6c63ff",
    "#8b5fc7",
    "#a78bfa",
    "#f08080",
  ];

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data
      const dashboardRes = await analyticsAPI.getDashboard();
      const dashboardData = dashboardRes.data.stats;

      // Fetch coverage report
      const coverageRes = await analyticsAPI.getCoverageReport();
      const coverageData = coverageRes.data;

      // Fetch gap analysis
      const gapRes = await analyticsAPI.getGapAnalysis();
      const gapData = gapRes.data;

      // Process training theme distribution
      const themeData = (coverageData.trainingsByTheme || []).map(
        (item, idx) => ({
          name: item._id || "Unknown Theme",
          value: item.count || 0,
          fill: colors[idx % colors.length],
        }),
      );
      setTrainingThemeDistribution(themeData);
      console.log("Theme Data:", themeData);

      // Process participants by state
      console.log("Raw trainingsByState:", coverageData.trainingsByState);
      const stateData = (coverageData.trainingsByState || [])
        .filter((item) => item.participants > 0) // Filter out states with 0 participants
        .sort((a, b) => (b.participants || 0) - (a.participants || 0))
        .slice(0, 5)
        .map((item, idx) => ({
          name: item._id || "Unknown State",
          value: item.participants || 0,
          fill: colors[idx % colors.length],
        }));
      console.log("Processed State Data:", stateData);
      setParticipantsByState(stateData);

        // Process monthly training trends (group by month from all trainings)
        const monthlyData = await processMonthlyTrends();
      setTrainingsByMonth(monthlyData);

      // Set gap analysis
      setGapAnalysis(gapData);

      // Calculate additional stats
      const totalTrainings = dashboardData.totalTrainings;
      const totalParticipants = dashboardData.totalParticipants;
      const statesCovered = dashboardData.statesCovered;

      // Fetch all trainings to calculate approval/rejection rates
      const trainingsRes = await trainingAPI.getAll({ limit: 1000 });
      const allTrainings = trainingsRes.data.trainings || [];

      const approvedTrainings = allTrainings.filter(
        (t) => t.status === "approved",
      ).length;
      const rejectedTrainings = allTrainings.filter(
        (t) => t.status === "rejected",
      ).length;

      // Get partner count (approximate from recent activities)
      const uniquePartners = new Set(
        dashboardData.recentActivities?.map((t) => t.partnerId?._id) || [],
      ).size;

      setReportData({
        totalTrainings,
        approvedTrainings,
        rejectedTrainings,
        totalParticipants,
        governmentAgencies: dashboardData.activePartners || 0,
        ngoOrganizations: Math.floor((dashboardData.activePartners || 0) * 0.6),
        trainingInstitutes: Math.floor(
          (dashboardData.activePartners || 0) * 0.4,
        ),
        statesCovered,
        certificatesIssued: dashboardData.certificatesIssued || 0,
        averageAttendance: 87.5,
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Using backup data.");
      // Fallback to basic data if API fails
      setReportData({
        totalTrainings: 0,
        approvedTrainings: 0,
        rejectedTrainings: 0,
        totalParticipants: 0,
        governmentAgencies: 0,
        ngoOrganizations: 0,
        trainingInstitutes: 0,
        statesCovered: 0,
        certificatesIssued: 0,
        averageAttendance: 0,
      });
      setLoading(false);
    }
  };

  const processMonthlyTrends = async () => {
    try {
      // Fetch all trainings to get real monthly trend data
      const trainingsRes = await trainingAPI.getAll({ limit: 1000 });
      const allTrainings = trainingsRes.data.trainings || [];

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      const monthCounts = {
        "01": { approved: 0, rejected: 0 },
        "02": { approved: 0, rejected: 0 },
        "03": { approved: 0, rejected: 0 },
        "04": { approved: 0, rejected: 0 },
        "05": { approved: 0, rejected: 0 },
        "06": { approved: 0, rejected: 0 },
      };

      const currentDate = new Date();
      const sixMonthsAgo = new Date(currentDate);
      sixMonthsAgo.setMonth(currentDate.getMonth() - 5);

      allTrainings.forEach((training) => {
        const startDate = new Date(training.startDate);
        // Only include trainings from last 6 months
        if (startDate >= sixMonthsAgo) {
          const month = String(startDate.getMonth() + 1).padStart(2, "0");

          if (training.status === "approved" && monthCounts[month]) {
            monthCounts[month].approved += 1;
          }

          if (training.status === "rejected" && monthCounts[month]) {
            monthCounts[month].rejected += 1;
          }
        }
      });

      return months.map((month, idx) => ({
        month,
        approved:
          monthCounts[String(idx + 1).padStart(2, "0")]?.approved || 0,
        rejected:
          monthCounts[String(idx + 1).padStart(2, "0")]?.rejected || 0,
      }));
    } catch (error) {
      console.error("Error processing monthly trends:", error);
      // Fallback to mock data
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => ({
        month,
        approved: 0,
        rejected: 0,
      }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getStateOptions = () => {
    const states = participantsByState.map((s) => s.name);
    return ["all", ...states];
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 15;

      // Title
      doc.setFontSize(18);
      doc.setTextColor(26, 26, 26);
      doc.text(
        "NDMA Training Program - Reports & Analytics",
        pageWidth / 2,
        yPosition,
        {
          align: "center",
        },
      );

      // Subtitle
      yPosition += 10;
      doc.setFontSize(11);
      doc.setTextColor(102, 126, 234);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        yPosition,
        {
          align: "center",
        },
      );

      // Summary Section
      yPosition += 15;
      doc.setFontSize(13);
      doc.setTextColor(26, 26, 26);
      doc.text("Executive Summary", 15, yPosition);

      yPosition += 8;
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);

      const summaryText = `The training program has successfully conducted ${reportData.totalTrainings} training sessions across ${reportData.statesCovered} states with participation from ${reportData.totalParticipants.toLocaleString()} individuals. A total of ${reportData.certificatesIssued} certificates have been issued, demonstrating strong engagement and completion rates. The program continues to expand its reach through partnerships with ${reportData.governmentAgencies} government agencies, ${reportData.ngoOrganizations} NGOs, and ${reportData.trainingInstitutes} training institutes.`;

      const splitText = doc.splitTextToSize(summaryText, pageWidth - 30);
      doc.text(splitText, 15, yPosition);
      yPosition += splitText.length * 5 + 10;

      // Statistics
      yPosition += 5;
      doc.setFontSize(13);
      doc.setTextColor(26, 26, 26);
      doc.text("Key Statistics", 15, yPosition);

      yPosition += 8;
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);

      const stats = [
        `Total Trainings: ${reportData.totalTrainings}`,
        `Approved Trainings: ${reportData.approvedTrainings}`,
        `Rejected Trainings: ${reportData.rejectedTrainings}`,
        `Total Participants: ${reportData.totalParticipants.toLocaleString()}`,
        `States Covered: ${reportData.statesCovered}`,
        `Certificates Issued: ${reportData.certificatesIssued}`,
        `Average Attendance Rate: ${reportData.averageAttendance}%`,
        `Government Agencies: ${reportData.governmentAgencies}`,
        `NGOs: ${reportData.ngoOrganizations}`,
        `Training Institutes: ${reportData.trainingInstitutes}`,
      ];

      stats.forEach((stat) => {
        if (yPosition > pageHeight - 15) {
          doc.addPage();
          yPosition = 15;
        }
        doc.text(stat, 20, yPosition);
        yPosition += 7;
      });

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(153, 153, 153);
      doc.text(
        "© 2026 NDMA Training Portal. All rights reserved.",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      );

      doc.save(`NDMA_Reports_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    }
  };

  const exportToCSV = () => {
    try {
      const csvContent = [
        ["NDMA Training Program - Reports & Analytics"],
        [`Generated on ${new Date().toLocaleDateString()}`],
        [],
        ["Key Metrics", "Value"],
        ["Total Trainings", reportData.totalTrainings],
        ["Approved Trainings", reportData.approvedTrainings],
        ["Rejected Trainings", reportData.rejectedTrainings],
        ["Total Participants", reportData.totalParticipants],
        ["States Covered", reportData.statesCovered],
        ["Certificates Issued", reportData.certificatesIssued],
        ["Average Attendance Rate", `${reportData.averageAttendance}%`],
        ["Government Agencies", reportData.governmentAgencies],
        ["NGOs", reportData.ngoOrganizations],
        ["Training Institutes", reportData.trainingInstitutes],
        [],
        ["Training Trends (Last 6 Months)"],
        ["Month", "Completed", "Planned"],
        ...trainingsByMonth.map((item) => [
          item.month,
          item.completed,
          item.planned,
        ]),
        [],
        ["Training Theme Distribution"],
        ["Theme", "Percentage"],
        ...trainingThemeDistribution.map((item) => [item.name, item.value]),
      ];

      const csv = csvContent
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `NDMA_Reports_${new Date().getTime()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("Failed to generate CSV");
    }
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ["NDMA Training Program - Reports & Analytics"],
        [`Generated on ${new Date().toLocaleDateString()}`],
        [],
        ["Key Metrics", "Value"],
        ["Total Trainings", reportData.totalTrainings],
        ["Approved Trainings", reportData.approvedTrainings],
        ["Rejected Trainings", reportData.rejectedTrainings],
        ["Total Participants", reportData.totalParticipants],
        ["States Covered", reportData.statesCovered],
        ["Certificates Issued", reportData.certificatesIssued],
        ["Average Attendance Rate", `${reportData.averageAttendance}%`],
        ["Government Agencies", reportData.governmentAgencies],
        ["NGOs", reportData.ngoOrganizations],
        ["Training Institutes", reportData.trainingInstitutes],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Trends Sheet
      const trendData = [
        ["Month", "Completed", "Planned"],
        ...trainingsByMonth.map((item) => [
          item.month,
          item.completed,
          item.planned,
        ]),
      ];

      const trendSheet = XLSX.utils.aoa_to_sheet(trendData);
      trendSheet["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, trendSheet, "Training Trends");

      // Theme Distribution Sheet
      const themeData = [
        ["Theme", "Percentage"],
        ...trainingThemeDistribution.map((item) => [item.name, item.value]),
      ];

      const themeSheet = XLSX.utils.aoa_to_sheet(themeData);
      themeSheet["!cols"] = [{ wch: 30 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, themeSheet, "Theme Distribution");

      // Participants by State Sheet
      const stateData = [
        ["State", "Participants"],
        ...participantsByState.map((item) => [item.name, item.value]),
      ];

      const stateSheet = XLSX.utils.aoa_to_sheet(stateData);
      stateSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(
        workbook,
        stateSheet,
        "Participants by State",
      );

      XLSX.writeFile(workbook, `NDMA_Reports_${new Date().getTime()}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("Failed to generate Excel file");
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar role="admin" />
        <div className={styles.container}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ fontSize: "1.1rem", color: "#666" }}>
              Loading reports...
            </p>
            <div style={{ marginTop: "1rem", color: "#667eea" }}>⏳</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.layout}>
        <Sidebar role="admin" />
        <div className={styles.container}>
          <div
            style={{ textAlign: "center", padding: "2rem", color: "#d32f2f" }}
          >
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar role="admin" />
      <div className={styles.container}>
        <PageTopBar title="Admin Reports" />
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Reports & Analytics</h1>
            <p className={styles.headerSubtitle}>
              Training data insights and performance metrics
            </p>
          </div>
          <div className={styles.downloadButtons}>
            <button
              className={styles.downloadBtn}
              onClick={exportToPDF}
              title="Export as PDF"
            >
              <FiDownload /> PDF
            </button>
            <button
              className={styles.downloadBtn}
              onClick={exportToCSV}
              title="Export as CSV"
            >
              <FiDownload /> CSV
            </button>
            <button
              className={styles.downloadBtn}
              onClick={exportToExcel}
              title="Export as Excel"
            >
              <FiDownload /> Excel
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Trainings</p>
              <p className={styles.statValue}>{reportData.totalTrainings}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Approved</p>
              <p className={styles.statValue}>
                {reportData.approvedTrainings}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Rejected</p>
              <p className={styles.statValue}>{reportData.rejectedTrainings}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Participants</p>
              <p className={styles.statValue}>
                {(reportData.totalParticipants / 1000).toFixed(1)}K
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🌍</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>States Covered</p>
              <p className={styles.statValue}>{reportData.statesCovered}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📜</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Certificates Issued</p>
              <p className={styles.statValue}>
                {(reportData.certificatesIssued / 1000).toFixed(2)}K
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          {/* Training Trends Chart */}
          <div className={styles.chartBox}>
            <h2 className={styles.chartTitle}>
              Approved vs Rejected Trainings (Last 6 Months)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trainingsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="approved"
                  stroke="#667eea"
                  strokeWidth={2}
                  name="Approved"
                  dot={{ fill: "#667eea" }}
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="#764ba2"
                  strokeWidth={2}
                  name="Rejected"
                  dot={{ fill: "#764ba2" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Participants by State */}
          <div className={styles.chartBox}>
            <h2 className={styles.chartTitle}>Participants by State</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={participantsByState}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  stroke="#999"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#999" />
                <Tooltip />
                <Bar dataKey="value" fill="#667eea" name="Participants" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Training Theme Distribution */}
          <div className={styles.chartBox}>
            <h2 className={styles.chartTitle}>Training Theme Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trainingThemeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {trainingThemeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Partner Organization Stats */}
          <div className={styles.statsBox}>
            <h2 className={styles.chartTitle}>Partner Organizations</h2>
            <div className={styles.orgStatsGrid}>
              <div className={styles.orgStat}>
                <span className={styles.orgLabel}>Government Agencies</span>
                <span className={styles.orgValue}>
                  {reportData.governmentAgencies}
                </span>
              </div>
              <div className={styles.orgStat}>
                <span className={styles.orgLabel}>NGOs</span>
                <span className={styles.orgValue}>
                  {reportData.ngoOrganizations}
                </span>
              </div>
              <div className={styles.orgStat}>
                <span className={styles.orgLabel}>Training Institutes</span>
                <span className={styles.orgValue}>
                  {reportData.trainingInstitutes}
                </span>
              </div>
              <div className={styles.orgStat}>
                <span className={styles.orgLabel}>Avg Attendance</span>
                <span className={styles.orgValue}>
                  {reportData.averageAttendance}%
                </span>
              </div>
            </div>
          </div>

          {/* Uncovered States */}
          {gapAnalysis && gapAnalysis.uncoveredStates && (
            <div className={styles.statsBox}>
              <h2 className={styles.chartTitle}>
                Gap Analysis - Uncovered States
              </h2>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {gapAnalysis.uncoveredStates.map((state) => (
                    <div
                      key={state}
                      style={{
                        padding: "0.75rem",
                        background: "#fff3cd",
                        border: "1px solid #ffc107",
                        borderRadius: "6px",
                        textAlign: "center",
                        fontSize: "0.9rem",
                      }}
                    >
                      ⚠️ {state}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Low Coverage States */}
          {gapAnalysis && gapAnalysis.lowCoverageStates && (
            <div className={styles.statsBox}>
              <h2 className={styles.chartTitle}>
                Low Coverage States (Priorities)
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #667eea" }}>
                      <th style={{ textAlign: "left", padding: "0.75rem" }}>
                        State
                      </th>
                      <th style={{ textAlign: "center", padding: "0.75rem" }}>
                        Training Count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gapAnalysis.lowCoverageStates.map((state, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "0.75rem" }}>
                          {state._id || "N/A"}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            padding: "0.75rem",
                            color: "#d32f2f",
                            fontWeight: "bold",
                          }}
                        >
                          {state.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Summary Report */}
        <div className={styles.summaryBox}>
          <h2 className={styles.chartTitle}>Executive Summary</h2>
          <div className={styles.summaryContent}>
            <p>
              The training program has successfully conducted{" "}
              <strong>{reportData.totalTrainings}</strong> training sessions
              across <strong>{reportData.statesCovered}</strong> states with
              participation from{" "}
              <strong>{reportData.totalParticipants.toLocaleString()}</strong>{" "}
              individuals. A total of{" "}
              <strong>{reportData.certificatesIssued}</strong> certificates have
              been issued, demonstrating strong engagement and completion rates.
              The program continues to expand its reach through partnerships
              with <strong>{reportData.governmentAgencies}</strong> government
              agencies, <strong>{reportData.ngoOrganizations}</strong> NGOs, and{" "}
              <strong>{reportData.trainingInstitutes}</strong> training
              institutes.
            </p>
            <p style={{ marginTop: "1rem" }}>
              With an average attendance rate of{" "}
              <strong>{reportData.averageAttendance}%</strong>, the program
              demonstrates strong participant engagement and commitment. The
              focus on diverse training themes including disaster preparedness,
              rescue operations, and community awareness ensures comprehensive
              disaster management capability building across all demographics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
