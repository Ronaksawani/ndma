import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiEye, FiSearch, FiMenu, FiSend, FiXCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { trainingAPI } from "../utils/api";
import styles from "../styles/Dashboard.module.css";
import themeOptions from "../data/themes.json";
import statesDistricts from "../data/statesDistricts.json";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOtherPartnersTrainings, setShowOtherPartnersTrainings] =
    useState(false);
  const [otherPartnersTrainings, setOtherPartnersTrainings] = useState([]);
  const [filterTheme, setFilterTheme] = useState("all");
  const [filterUpcoming, setFilterUpcoming] = useState(false);
  const [filterState, setFilterState] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [showLocationOverlay, setShowLocationOverlay] = useState(false);
  const locationRef = useRef(null);

  const availableDistricts = (() => {
    if (filterState === "all") {
      return Array.from(
        new Set(Object.values(statesDistricts.districts).flat()),
      );
    }

    const stateObj = statesDistricts.states.find(
      (s) => s.label === filterState,
    );
    const key = stateObj ? stateObj.value : null;
    return key ? statesDistricts.districts[key] || [] : [];
  })();

  const getPartnerIdValue = (training) => {
    const partner = training?.partnerId || training?.partner;

    if (partner && typeof partner === "object") {
      return partner._id || null;
    }

    return partner || null;
  };

  const getPartnerLabel = (training) => {
    const partner = training?.partnerId || training?.partner;

    if (!partner) return "-";
    if (typeof partner === "object")
      return partner.organizationName || partner.name || partner._id || "-";
    return training?.partnerName || partner || "-";
  };

  useEffect(() => {
    fetchTrainings();
    fetchOtherPartnersTrainings();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        showLocationOverlay &&
        locationRef.current &&
        !locationRef.current.contains(e.target)
      ) {
        setShowLocationOverlay(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLocationOverlay]);

  useEffect(() => {
    filterTrainings();
  }, [
    searchTerm,
    trainings,
    showOtherPartnersTrainings,
    otherPartnersTrainings,
    filterTheme,
    filterState,
    filterDistrict,
    filterUpcoming,
  ]);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const response = await trainingAPI.getAll({
        partnerId: user?.organizationId,
      });
      setTrainings(response.data.trainings || response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch trainings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherPartnersTrainings = async () => {
    try {
      const response = await trainingAPI.getAll({ limit: 1000 });
      const allTrainings = response.data.trainings || response.data;
      const otherPartnersOnly = allTrainings.filter(
        (training) => getPartnerIdValue(training) !== user?.organizationId,
      );
      setOtherPartnersTrainings(otherPartnersOnly);
    } catch (err) {
      console.error("Failed to fetch other partners' trainings", err);
    }
  };

  const filterTrainings = () => {
    let dataSource = showOtherPartnersTrainings
      ? otherPartnersTrainings
      : trainings;

    if (showOtherPartnersTrainings) {
      const now = new Date();
      dataSource = dataSource.filter((training) => {
        const startDate = new Date(training.startDate);
        return (
          training.status?.toLowerCase() === "approved" || startDate >= now
        );
      });
    }

    if (filterUpcoming) {
      const now2 = new Date();
      dataSource = dataSource.filter(
        (training) => new Date(training.startDate) >= now2,
      );
    }

    if (filterTheme && filterTheme !== "all") {
      dataSource = dataSource.filter(
        (t) => (t.theme || "").toString() === filterTheme,
      );
    }

    if (filterState && filterState !== "all") {
      dataSource = dataSource.filter(
        (t) => (t.location?.state || "") === filterState,
      );
    }

    if (filterDistrict && filterDistrict !== "all") {
      dataSource = dataSource.filter(
        (t) => (t.location?.district || "") === filterDistrict,
      );
    }

    const filtered = dataSource.filter(
      (training) =>
        (training.title || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (training.location?.district || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (training.location?.state || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (training.location?.city || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (training.theme || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );

    setFilteredTrainings(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      upcoming: { color: "#2563eb", bg: "#dbeafe", label: "Upcoming" },
      canceled: { color: "#6b7280", bg: "#f3f4f6", label: "Canceled" },
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
    startIdx + ITEMS_PER_PAGE,
  );

  const handleEdit = (id) => navigate(`/partner/edit-training/${id}`);
  const handleView = (id) => navigate(`/partner/view-training/${id}`);
  const handleSubmitForApproval = (id) => {
    navigate("/partner/add-training", {
      state: { scheduledTrainingId: id },
    });
  };

  const handleCancelScheduled = async (id) => {
    const confirmed = window.confirm(
      "Cancel this scheduled training? This cannot be submitted for approval later unless recreated.",
    );
    if (!confirmed) return;

    try {
      await trainingAPI.cancelScheduled(id);
      await fetchTrainings();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to cancel scheduled training",
      );
    }
  };

  return (
    <div className="layout-container">
      <Sidebar role="partner" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <div className="top-nav">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <FiMenu size={24} />
          </button>
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

            {/* Search + Filters (single row) */}
            <div
              style={{
                marginBottom: "20px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "nowrap",
              }}
            >
              <div style={{ position: "relative", flex: "0 1 40%" }}>
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
                    padding: "10px 12px 10px 36px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => setShowOtherPartnersTrainings((s) => !s)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: showOtherPartnersTrainings
                      ? "1px solid #3b82f6"
                      : "1px solid #ddd",
                    backgroundColor: showOtherPartnersTrainings
                      ? "#3b82f6"
                      : "white",
                    color: showOtherPartnersTrainings ? "white" : "#374151",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "normal",
                    whiteSpace: "nowrap",
                  }}
                  title="Toggle showing other partners' trainings"
                >
                  {showOtherPartnersTrainings
                    ? "Showing Others Trainings"
                    : "Show Others Trainings"}
                </button>

                <select
                  value={filterTheme}
                  onChange={(e) => setFilterTheme(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: "normal",
                  }}
                  title="Filter by theme"
                >
                  <option value="all">All Theme</option>
                  {themeOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowLocationOverlay((s) => !s)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "normal",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "#374151" }}>Location</span>
                  <span
                    style={{
                      transform: showLocationOverlay
                        ? "rotate(180deg)"
                        : "none",
                    }}
                  >
                    ▼
                  </span>
                </button>

                <button
                  onClick={() => setFilterUpcoming((s) => !s)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: filterUpcoming
                      ? "1px solid #3b82f6"
                      : "1px solid #ddd",
                    backgroundColor: filterUpcoming ? "#3b82f6" : "white",
                    color: filterUpcoming ? "white" : "#374151",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "normal",
                  }}
                  title="Toggle upcoming trainings"
                >
                  Upcoming
                </button>

                {/* Location overlay */}
                <div
                  ref={locationRef}
                  style={{ position: "absolute", top: "44px", right: 0 }}
                >
                  {showLocationOverlay && (
                    <div
                      style={{
                        minWidth: "260px",
                        background: "white",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                        padding: "12px",
                        borderRadius: "8px",
                        zIndex: 1200,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span style={{ fontSize: "13px", color: "#374151" }}>
                            State
                          </span>
                          <select
                            value={filterState}
                            onChange={(e) => {
                              setFilterState(e.target.value);
                              setFilterDistrict("all");
                            }}
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid #ddd",
                            }}
                          >
                            <option value="all">All</option>
                            {statesDistricts.states.map((st) => (
                              <option key={st.value} value={st.label}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span style={{ fontSize: "13px", color: "#374151" }}>
                            District
                          </span>
                          <select
                            value={filterDistrict}
                            onChange={(e) => setFilterDistrict(e.target.value)}
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid #ddd",
                            }}
                          >
                            <option value="all">All</option>
                            {availableDistricts.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
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
                <div
                  style={{
                    marginBottom: "16px",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  {showOtherPartnersTrainings
                    ? "Showing approved & upcoming trainings from other partners"
                    : "Showing your trainings"}
                </div>

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
                          Theme
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
                        {showOtherPartnersTrainings && (
                          <th
                            style={{
                              padding: "12px",
                              textAlign: "left",
                              fontWeight: "600",
                              color: "#374151",
                            }}
                          >
                            Partner Organization
                          </th>
                        )}
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
                          style={{ borderBottom: "1px solid #e5e7eb" }}
                        >
                          <td style={{ padding: "12px" }}>
                            <strong>{training.title}</strong>
                          </td>
                          <td style={{ padding: "12px" }}>
                            {(() => {
                              const themeObj = themeOptions.find(
                                (t) => t.value === training.theme,
                              );
                              return themeObj
                                ? `${themeObj.emoji} ${themeObj.label}`
                                : training.theme || "-";
                            })()}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {training.startDate
                              ? new Date(
                                  training.startDate,
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {training.endDate
                              ? new Date(training.endDate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {training.location?.district},{" "}
                            {training.location?.state}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {training.participantsCount || 0}
                          </td>
                          {showOtherPartnersTrainings && (
                            <td style={{ padding: "12px" }}>
                              {getPartnerLabel(training)}
                            </td>
                          )}
                          <td style={{ padding: "12px" }}>
                            {getStatusBadge(training.status)}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              {!showOtherPartnersTrainings && !(training.status === "approved") && (
                                <button
                                  onClick={() => handleEdit(training._id)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "8px",
                                    border: "1px solid #3b82f6",
                                    color: "#3b82f6",
                                    backgroundColor: "white",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                  }}
                                  title="Edit Training"
                                >
                                  <FiEdit2 size={16} />
                                </button>
                              )}
                              {!showOtherPartnersTrainings &&
                                training.status?.toLowerCase() ===
                                  "upcoming" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleSubmitForApproval(training._id)
                                      }
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "8px",
                                        border: "1px solid #10b981",
                                        color: "#10b981",
                                        backgroundColor: "white",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                      }}
                                      title="Submit for approval"
                                    >
                                      <FiSend size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleCancelScheduled(training._id)
                                      }
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "8px",
                                        border: "1px solid #ef4444",
                                        color: "#ef4444",
                                        backgroundColor: "white",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                      }}
                                      title="Cancel scheduled training"
                                    >
                                      <FiXCircle size={16} />
                                    </button>
                                  </>
                                )}
                              <button
                                onClick={() => handleView(training._id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "8px",
                                  border: "1px solid #6b7280",
                                  color: "#6b7280",
                                  backgroundColor: "white",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontWeight: "500",
                                }}
                                title="View Training"
                              >
                                <FiEye size={16} />
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
                      filteredTrainings.length,
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
                      ),
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
