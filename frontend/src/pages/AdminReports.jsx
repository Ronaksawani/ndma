import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { analyticsAPI } from "../utils/api";
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
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    state: "all",
    status: "all",
  });

  // Mock data for charts
  const trainingsByMonth = [
    { month: "Jan", completed: 45, planned: 20 },
    { month: "Feb", completed: 52, planned: 25 },
    { month: "Mar", completed: 48, planned: 22 },
    { month: "Apr", completed: 61, planned: 35 },
    { month: "May", completed: 55, planned: 28 },
    { month: "Jun", completed: 67, planned: 40 },
  ];

  const participantsByState = [
    { name: "Maharashtra", value: 8500, fill: "#667eea" },
    { name: "Gujarat", value: 7200, fill: "#764ba2" },
    { name: "Rajasthan", value: 6300, fill: "#6c63ff" },
    { name: "Uttar Pradesh", value: 9100, fill: "#8b5fc7" },
    { name: "Others", value: 5900, fill: "#a78bfa" },
  ];

  const trainingThemeDistribution = [
    { name: "Disaster Preparedness", value: 28, fill: "#667eea" },
    { name: "Rescue Operations", value: 22, fill: "#764ba2" },
    { name: "First Aid", value: 25, fill: "#6c63ff" },
    { name: "Community Awareness", value: 15, fill: "#8b5fc7" },
    { name: "Others", value: 10, fill: "#a78bfa" },
  ];

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setReportData({
          totalTrainings: 1250,
          completedTrainings: 980,
          plannedTrainings: 270,
          totalParticipants: 50000,
          governmentAgencies: 120,
          ngoOrganizations: 85,
          trainingInstitutes: 45,
          statesCovered: 28,
          certificatesIssued: 48500,
          averageAttendance: 87.5,
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const downloadReport = (format) => {
    alert(`Downloading report as ${format}...`);
    // Implementation for actual download
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
      doc.text("NDMA Training Program - Reports & Analytics", pageWidth / 2, yPosition, {
        align: "center",
      });

      // Subtitle
      yPosition += 10;
      doc.setFontSize(11);
      doc.setTextColor(102, 126, 234);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, {
        align: "center",
      });

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
        `Completed Trainings: ${reportData.completedTrainings}`,
        `Planned Trainings: ${reportData.plannedTrainings}`,
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
        { align: "center" }
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
        ["Completed Trainings", reportData.completedTrainings],
        ["Planned Trainings", reportData.plannedTrainings],
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
        ...trainingsByMonth.map((item) => [item.month, item.completed, item.planned]),
        [],
        ["Training Theme Distribution"],
        ["Theme", "Percentage"],
        ...trainingThemeDistribution.map((item) => [item.name, item.value]),
      ];

      const csv = csvContent.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

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
        ["Completed Trainings", reportData.completedTrainings],
        ["Planned Trainings", reportData.plannedTrainings],
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
        ...trainingsByMonth.map((item) => [item.month, item.completed, item.planned]),
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
      XLSX.utils.book_append_sheet(workbook, stateSheet, "Participants by State");

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
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar role="admin" />
      <div className={styles.container}>
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

        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <label>
              <FiFilter /> Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>State</label>
            <select
              name="state"
              value={filters.state}
              onChange={handleFilterChange}
            >
              <option value="all">All States</option>
              <option value="maharashtra">Maharashtra</option>
              <option value="gujarat">Gujarat</option>
              <option value="rajasthan">Rajasthan</option>
              <option value="uttarpradesh">Uttar Pradesh</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="planned">Planned</option>
            </select>
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
              <p className={styles.statLabel}>Completed</p>
              <p className={styles.statValue}>{reportData.completedTrainings}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Planned</p>
              <p className={styles.statValue}>{reportData.plannedTrainings}</p>
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
                {(reportData.certificatesIssued / 1000).toFixed(1)}K
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          {/* Training Trends Chart */}
          <div className={styles.chartBox}>
            <h2 className={styles.chartTitle}>Training Trends (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trainingsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#667eea"
                  strokeWidth={2}
                  name="Completed"
                  dot={{ fill: "#667eea" }}
                />
                <Line
                  type="monotone"
                  dataKey="planned"
                  stroke="#764ba2"
                  strokeWidth={2}
                  name="Planned"
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
                <XAxis dataKey="name" stroke="#999" angle={-45} textAnchor="end" height={80} />
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
                <span className={styles.orgValue}>{reportData.governmentAgencies}</span>
              </div>
              <div className={styles.orgStat}>
                <span className={styles.orgLabel}>NGOs</span>
                <span className={styles.orgValue}>{reportData.ngoOrganizations}</span>
              </div>
              <div className={styles.orgStat}>
                <span className={styles.orgLabel}>Training Institutes</span>
                <span className={styles.orgValue}>{reportData.trainingInstitutes}</span>
              </div>
              <div className={styles.orgStat}>
                <span className={styles.orgLabel}>Avg Attendance</span>
                <span className={styles.orgValue}>{reportData.averageAttendance}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Report */}
        <div className={styles.summaryBox}>
          <h2 className={styles.chartTitle}>Executive Summary</h2>
          <div className={styles.summaryContent}>
            <p>
              The training program has successfully conducted <strong>{reportData.totalTrainings}</strong> training
              sessions across <strong>{reportData.statesCovered}</strong> states with participation from{" "}
              <strong>{reportData.totalParticipants.toLocaleString()}</strong> individuals. A total of{" "}
              <strong>{reportData.certificatesIssued}</strong> certificates have been issued, demonstrating strong
              engagement and completion rates. The program continues to expand its reach through partnerships with{" "}
              <strong>{reportData.governmentAgencies}</strong> government agencies, <strong>{reportData.ngoOrganizations}</strong> NGOs,
              and <strong>{reportData.trainingInstitutes}</strong> training institutes.
            </p>
            <p style={{ marginTop: "1rem" }}>
              With an average attendance rate of <strong>{reportData.averageAttendance}%</strong>, the program demonstrates
              strong participant engagement and commitment. The focus on diverse training themes including disaster
              preparedness, rescue operations, and community awareness ensures comprehensive disaster management capability
              building across all demographics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
