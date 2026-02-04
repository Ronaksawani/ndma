import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { partnerAPI, trainingAPI } from "../utils/api";
import styles from "../styles/AdminManagePartner.module.css";
import { FiChevronLeft } from "react-icons/fi";

const AdminManagePartner = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [partner, setPartner] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPartnerDetails();
  }, [id]);

  const fetchPartnerDetails = async () => {
    try {
      setLoading(true);
      const response = await partnerAPI.getById(id);
      setPartner(response.data);

      // Fetch trainings for this partner
      const trainingsResponse = await trainingAPI.getByPartnerId(id);
      setTrainings(trainingsResponse.data.trainings || []);
    } catch (error) {
      console.error("Error fetching partner details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockPartner = async () => {
    if (!window.confirm("Are you sure you want to block this partner account?")) {
      return;
    }

    try {
      setActionLoading(true);
      await partnerAPI.updateStatus(id, "blocked");
      alert("Partner account blocked successfully");
      navigate("/admin/partners");
    } catch (error) {
      console.error("Error blocking partner:", error);
      alert("Failed to block partner account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockPartner = async () => {
    if (!window.confirm("Are you sure you want to unblock this partner account?")) {
      return;
    }

    try {
      setActionLoading(true);
      await partnerAPI.updateStatus(id, "active");
      alert("Partner account unblocked successfully");
      fetchPartnerDetails();
    } catch (error) {
      console.error("Error unblocking partner:", error);
      alert("Failed to unblock partner account");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { class: styles.statusCompleted, text: "Approved" },
      pending: { class: styles.statusPending, text: "Pending" },
      rejected: { class: styles.statusRejected, text: "Rejected" },
    };
    return statusMap[status] || { class: styles.statusPending, text: status };
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar role="admin" />
        <div className={styles.container}>
          <p>Loading partner details...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className={styles.layout}>
        <Sidebar role="admin" />
        <div className={styles.container}>
          <p>Partner not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar role="admin" />
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/admin/partners")}
          >
            <FiChevronLeft /> Back
          </button>
          <h1>Manage Partner: {partner.organizationName}</h1>
        </div>

        <div className={styles.content}>
          {/* Left Column - Partner Profile */}
          <div className={styles.leftColumn}>
            <div className={styles.profileBox}>
              <h2 className={styles.sectionTitle}>Partner Profile</h2>

              <div className={styles.profileGrid}>
                <div className={styles.profileField}>
                  <label>Type</label>
                  <p>{partner.organizationType || "N/A"}</p>
                </div>

                <div className={styles.profileField}>
                  <label>Registration Date</label>
                  <p>
                    {partner.createdAt
                      ? new Date(partner.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>

                <div className={styles.profileField}>
                  <label>Email</label>
                  <p>{partner.email || "N/A"}</p>
                </div>

                <div className={styles.profileField}>
                  <label>Phone</label>
                  <p>{partner.phone || "N/A"}</p>
                </div>

                <div className={styles.profileField}>
                  <label>Address</label>
                  <p>{partner.address || "N/A"}</p>
                </div>

                <div className={styles.profileField}>
                  <label>Status</label>
                  <p>
                    <span
                      className={
                        partner.status === "blocked"
                          ? styles.statusBlocked
                          : styles.statusActive
                      }
                    >
                      {partner.status === "blocked" ? "Blocked" : "Active"}
                    </span>
                  </p>
                </div>
              </div>

              <div className={styles.accountActions}>
                <h3>Account Actions</h3>
                {partner.status === "blocked" ? (
                  <button
                    className={styles.unblockButton}
                    onClick={handleUnblockPartner}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "Unblock Partner Account"}
                  </button>
                ) : (
                  <button
                    className={styles.blockButton}
                    onClick={handleBlockPartner}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "Block Partner Account"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Training History */}
          <div className={styles.rightColumn}>
            <div className={styles.trainingBox}>
              <h2 className={styles.sectionTitle}>Training History</h2>

              {trainings.length > 0 ? (
                <div className={styles.trainingTable}>
                  <div className={styles.tableHeader}>
                    <div className={styles.headerCell}>Data name</div>
                    <div className={styles.headerCell}>Status</div>
                  </div>

                  <div className={styles.tableBody}>
                    {trainings.map((training) => {
                      const statusInfo = getStatusBadge(training.status);
                      return (
                        <div key={training._id} className={styles.tableRow}>
                          <div className={styles.cell}>{training.title}</div>
                          <div className={styles.cell}>
                            <span className={statusInfo.class}>
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className={styles.noData}>No training history</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManagePartner;
