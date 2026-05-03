import React, { useEffect, useState } from "react";
import { FiMenu } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { participantAPI, trainingAPI } from "../utils/api";
import styles from "../styles/Participant.module.css";

export default function ParticipantMyParticipations() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await participantAPI.getRecords();
      setRecords(res.data?.records || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (item) => {
    if (item.certificateIssued) return { text: "Completed", class: styles.badgeSuccess };
    if (item.status === "cancelled") return { text: "Cancelled", class: styles.badgeCancelled };
    const now = new Date();
    const endDate = item.trainingDates?.end ? new Date(item.trainingDates.end) : null;
    if (endDate && endDate < now) return { text: "Ongoing", class: styles.badgeOngoing };
    return { text: "Registered", class: styles.badgeRegistered };
  };

  const handleCancelParticipation = async (trainingId) => {
    if (!window.confirm("Are you sure you want to cancel your registration?")) {
      return;
    }

    try {
      setCancellingId(trainingId);
      await trainingAPI.cancelRegistration(trainingId);
      
      // Update local state
      setRecords(prev => prev.map(r => 
        r.trainingId === trainingId 
          ? { ...r, status: "cancelled" }
          : r
      ));
      
      alert("Registration cancelled successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to cancel registration");
    } finally {
      setCancellingId(null);
    }
  };

  const getFilteredRecords = () => {
    if (statusFilter === "all") return records;
    if (statusFilter === "registered") {
      return records.filter(r => r.status !== "cancelled" && !r.certificateIssued);
    }
    if (statusFilter === "completed") {
      return records.filter(r => r.certificateIssued);
    }
    if (statusFilter === "cancelled") {
      return records.filter(r => r.status === "cancelled");
    }
    return records;
  };

  const filteredRecords = getFilteredRecords();

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar role="participant" />
        <main className={styles.main}>
          <header className={styles.topBar}>
            <h1 className={styles.title}>My Participations</h1>
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
          <h1 className={styles.title}>My Participations ({records.length})</h1>
        </header>
        <section className={styles.page}>
          {/* Status Filter */}
          <div className={styles.statusFilterBar}>
            <button
              className={`${styles.statusBtn} ${statusFilter === "all" ? styles.activeStatusBtn : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All ({records.length})
            </button>
            <button
              className={`${styles.statusBtn} ${statusFilter === "registered" ? styles.activeStatusBtn : ""}`}
              onClick={() => setStatusFilter("registered")}
            >
              Registered ({records.filter(r => r.status !== "cancelled" && !r.certificateIssued).length})
            </button>
            <button
              className={`${styles.statusBtn} ${statusFilter === "completed" ? styles.activeStatusBtn : ""}`}
              onClick={() => setStatusFilter("completed")}
            >
              Completed ({records.filter(r => r.certificateIssued).length})
            </button>
            <button
              className={`${styles.statusBtn} ${statusFilter === "cancelled" ? styles.activeStatusBtn : ""}`}
              onClick={() => setStatusFilter("cancelled")}
            >
              Cancelled ({records.filter(r => r.status === "cancelled").length})
            </button>
          </div>

          {filteredRecords.length === 0 ? (
            <div className={styles.noRecords}>
              <p>No {statusFilter !== "all" ? statusFilter : ""} participations found.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Training</th>
                    <th>Theme</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Certificate</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((item) => {
                    const statusInfo = getStatusBadge(item);
                    const isUpcoming = item.trainingDates?.end ? new Date(item.trainingDates.end) > new Date() : false;
                    
                    return (
                      <tr key={item._id} className={styles.participationRow}>
                        <td className={styles.trainingNameCell}>
                          <strong>{item.trainingTitle}</strong>
                        </td>
                        <td>{item.trainingTheme}</td>
                        <td>
                          <div className={styles.datesCell}>
                            <small>{formatDate(item.trainingDates?.start)}</small>
                            <span className={styles.dateSeparator}>→</span>
                            <small>{formatDate(item.trainingDates?.end)}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${statusInfo.class}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td>
                          {item.certificateIssued ? (
                            <span className={`${styles.badge} ${styles.badgeCertIssued}`}>
                              ✓ Issued
                            </span>
                          ) : (
                            <span className={styles.badgePending}>Pending</span>
                          )}
                        </td>
                        <td>
                          {item.status !== "cancelled" && isUpcoming && (
                            <button
                              className={styles.cancelBtn}
                              onClick={() => handleCancelParticipation(item.trainingId)}
                              disabled={cancellingId === String(item.trainingId)}
                            >
                              {cancellingId === String(item.trainingId) ? "Cancelling..." : "Cancel"}
                            </button>
                          )}
                          {item.certificateIssued && (
                            <span className={styles.actionText}>View in Certificates</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
