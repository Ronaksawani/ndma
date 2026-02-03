import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiEye, FiSearch } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { trainingAPI } from "../utils/api";
import styles from "../styles/Dashboard.module.css";

const ITEMS_PER_PAGE = 10;

export default function MyTrainings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [filteredTrainings, setFilteredTrainings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrainings();
  }, []);

  useEffect(() => {
    filterTrainings();
  }, [searchTerm, trainings]);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const response = await trainingAPI.getAll({ partnerId: user?.partnerId });
      console.log("Trainings fetched:", response.data);

      setTrainings(response.data.trainings || response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch trainings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterTrainings = () => {
    const filtered = trainings.filter(
      (training) =>
        training.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.location?.district
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        training.location?.state
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        training.location?.city
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        training.theme?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTrainings(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      approved: { color: "#10b981", bg: "#d1fae5", label: "Approved" },
      pending: { color: "#f59e0b", bg: "#fef3c7", label: "Pending" },
      rejected: { color: "#ef4444", bg: "#fee2e2", label: "Rejected" },
    };

    const style = statusStyles[status?.toLowerCase()] || statusStyles.pending;
    return (
      <span
        style={{
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600",
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {style.label}
      </span>
    );
  };

  const totalPages = Math.ceil(filteredTrainings.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTrainings = filteredTrainings.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  );

  const handleEdit = (id) => {
    // Navigate to edit page - can be implemented later
    navigate(`/partner/edit-training/${id}`);
  };

  const handleView = (id) => {
    // Navigate to view page - can be implemented later
    navigate(`/partner/view-training/${id}`);
  };

  return (
    <div className="layout-container">
      <Sidebar role="partner" />
      <div className="main-content">
        <div className="top-nav">
          <h2 className="nav-title">
            My Trainings - {user?.organizationName || "[Organization Name]"}
          </h2>
          <div className="nav-right">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.contactPerson?.[0]?.toUpperCase()}
              </div>
              <span>Partner</span>
            </div>
          </div>
        </div>

        <div className="page-content">
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Search Bar */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <FiSearch
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search trainings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    paddingLeft: "36px",
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                Loading trainings...
              </div>
            ) : filteredTrainings.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#666" }}
              >
                No trainings found
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "14px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: "#f9fafb",
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Training Title
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Start Date
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          End Date
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Location
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Participants
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTrainings.map((training) => (
                        <tr
                          key={training._id}
                          style={{
                            borderBottom: "1px solid #e5e7eb",
                            "&:hover": { backgroundColor: "#f9fafb" },
                          }}
                        >
                          <td style={{ padding: "12px" }}>
                            <strong>{training.title}</strong>
                          </td>
                          <td style={{ padding: "12px" }}>
                            {training.startDate
                              ? new Date(
                                  training.startDate
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {training.endDate
                              ? new Date(training.endDate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {training.location.district},{" "}
                            {training.location.state}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {training.participantsCount || 0}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {getStatusBadge(training.status)}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => handleEdit(training._id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "6px 12px",
                                  border: "1px solid #3b82f6",
                                  color: "#3b82f6",
                                  backgroundColor: "white",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  transition: "all 0.2s",
                                }}
                                title="Edit Training"
                              >
                                <FiEdit2 size={14} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleView(training._id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "6px 12px",
                                  border: "1px solid #6b7280",
                                  color: "#6b7280",
                                  backgroundColor: "white",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  transition: "all 0.2s",
                                }}
                                title="View Training"
                              >
                                <FiEye size={14} />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "#666",
                    fontSize: "13px",
                  }}
                >
                  <span>
                    Showing {startIdx + 1} to{" "}
                    {Math.min(
                      startIdx + ITEMS_PER_PAGE,
                      filteredTrainings.length
                    )}{" "}
                    of {filteredTrainings.length} trainings
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        backgroundColor:
                          currentPage === 1 ? "#f3f4f6" : "white",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        color: currentPage === 1 ? "#999" : "#333",
                      }}
                    >
                      ←
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            minWidth: "30px",
                            padding: "6px 10px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            backgroundColor:
                              currentPage === page ? "#3b82f6" : "white",
                            color: currentPage === page ? "white" : "#333",
                            cursor: "pointer",
                            fontWeight: currentPage === page ? "600" : "normal",
                          }}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        backgroundColor:
                          currentPage === totalPages ? "#f3f4f6" : "white",
                        cursor:
                          currentPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                        color: currentPage === totalPages ? "#999" : "#333",
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
