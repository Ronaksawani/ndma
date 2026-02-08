import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { trainingAPI, partnerAPI } from "../utils/api";
import statesDistrictsData from "../data/statesDistricts.json";
import styles from "../styles/AdminTrainingEvents.module.css";
import { FiSearch, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

const AdminTrainingEvents = () => {
  const navigate = useNavigate();
  const [trainings, setTrainings] = useState([]);
  const [filteredTrainings, setFilteredTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [partners, setPartners] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    theme: "all",
  });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    theme: "",
    description: "",
    startDate: "",
    endDate: "",
    state: "",
    city: "",
    district: "",
    latitude: "",
    longitude: "",
    trainerName: "",
    trainerEmail: "",
    participantsCount: "",
    government: "",
    ngo: "",
    volunteers: "",
    partnerId: "",
  });

  const itemsPerPage = 10;
  const themes = [
    "Flood Management",
    "Earthquake Safety",
    "Cyclone Management",
    "First Aid",
    "Fire Safety",
    "Landslide Management",
    "Tsunami Awareness",
  ];

  const statuses = ["all", "pending", "approved", "rejected"];

  useEffect(() => {
    fetchTrainings();
    fetchPartners();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const response = await trainingAPI.getAll({ limit: 100 });
      console.log("API Response - Total trainings returned:", response.data.trainings?.length);
      setTrainings(response.data.trainings || []);
      setFilteredTrainings(response.data.trainings || []);
    } catch (error) {
      console.error("Error fetching trainings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await partnerAPI.getAll({ limit: 100 });
      setPartners(response.data.partners || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
  };

  useEffect(() => {
    let filtered = trainings;

    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    // Apply theme filter
    if (filters.theme !== "all") {
      filtered = filtered.filter((t) => t.theme === filters.theme);
    }

    // Apply search
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (training) =>
          training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          training.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          training.location?.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          training.partnerId?.organizationName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTrainings(filtered);
    setCurrentPage(1);
  }, [searchTerm, trainings, filters]);

  const paginatedTrainings = filteredTrainings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredTrainings.length / itemsPerPage);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "approved":
        return styles.statusCompleted;
      case "pending":
        return styles.statusPlanned;
      case "rejected":
        return styles.statusRejected;
      default:
        return styles.statusPlanned;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const handleRowClick = (trainingId) => {
    navigate(`/admin/training/${trainingId}`);
  };

  const handleAddTraining = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);

      const payload = {
        ...formData,
        participantsCount: parseInt(formData.participantsCount) || 0,
        government: parseInt(formData.government) || 0,
        ngo: parseInt(formData.ngo) || 0,
        volunteers: parseInt(formData.volunteers) || 0,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      // Use admin-specific endpoint
      const response = await fetch("http://localhost:4000/api/trainings/admin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create training");
      }

      alert("Training event created successfully!");
      setShowAddForm(false);
      setFormData({
        title: "",
        theme: "",
        description: "",
        startDate: "",
        endDate: "",
        state: "",
        city: "",
        district: "",
        latitude: "",
        longitude: "",
        trainerName: "",
        trainerEmail: "",
        participantsCount: "",
        government: "",
        ngo: "",
        volunteers: "",
        partnerId: "",
      });
      fetchTrainings();
    } catch (error) {
      console.error("Error creating training:", error);
      alert("Failed to create training: " + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "state") {
      // Reset district when state changes
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        district: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Get available districts based on selected state
  const getDistrictsForState = (stateValue) => {
    if (!stateValue) return [];
    return statesDistrictsData.districts[stateValue] || [];
  };

  const availableDistricts = getDistrictsForState(formData.state);

  return (
    <div className={styles.layout}>
      <Sidebar role="admin" />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Training Events List</h1>
        </div>

        {/* Filters and Search */}
        <div className={styles.filtersRow}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
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

        {loading ? (
          <div className={styles.loadingState}>
            <p>Loading training events...</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Organizer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrainings.length > 0 ? (
                    paginatedTrainings.map((training) => (
                      <tr
                        key={training._id}
                        onClick={() => handleRowClick(training._id)}
                        className={styles.tableRow}
                      >
                        <td>{training.title}</td>
                        <td>
                          {training.startDate && training.endDate
                            ? `${formatDate(training.startDate)} - ${formatDate(
                                training.endDate
                              )}`
                            : "N/A"}
                        </td>
                        <td>
                          {training.location?.city}, {training.location?.state}
                        </td>
                        <td>{training.partnerId?.organizationName || "N/A"}</td>
                        <td>
                          <span className={getStatusBadgeClass(training.status)}>
                            {training.status?.charAt(0).toUpperCase() +
                              training.status?.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className={styles.noData}>
                        No training events found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className={styles.pageButton}
                >
                  <FiChevronLeft /> Previous
                </button>

                <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className={styles.pageButton}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Add Training Modal */}
      {showAddForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Add New Training Event</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddForm(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAddTraining} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Event Name *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g., Flood Rescue Training"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Theme *</label>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Theme</option>
                    {themes.map((theme) => (
                      <option key={theme} value={theme}>
                        {theme}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Partner *</label>
                  <select
                    name="partnerId"
                    value={formData.partnerId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Partner</option>
                    {partners.map((partner) => (
                      <option key={partner._id} value={partner._id}>
                        {partner.organizationName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select State</option>
                    {statesDistrictsData.states.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>District</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleFormChange}
                    disabled={!formData.state}
                  >
                    <option value="">
                      {formData.state ? "Select District" : "Select State First"}
                    </option>
                    {availableDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g., Guwahati"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Trainer Name</label>
                  <input
                    type="text"
                    name="trainerName"
                    value={formData.trainerName}
                    onChange={handleFormChange}
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Trainer Email</label>
                  <input
                    type="email"
                    name="trainerEmail"
                    value={formData.trainerEmail}
                    onChange={handleFormChange}
                    placeholder="trainer@example.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Total Participants</label>
                  <input
                    type="number"
                    name="participantsCount"
                    value={formData.participantsCount}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Government Officials</label>
                  <input
                    type="number"
                    name="government"
                    value={formData.government}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>NGO Representatives</label>
                  <input
                    type="number"
                    name="ngo"
                    value={formData.ngo}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Volunteers</label>
                  <input
                    type="number"
                    name="volunteers"
                    value={formData.volunteers}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Latitude</label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleFormChange}
                    placeholder="e.g., 26.1445"
                    step="0.0001"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Longitude</label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleFormChange}
                    placeholder="e.g., 91.7362"
                    step="0.0001"
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Event description..."
                    rows="4"
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowAddForm(false)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={formLoading}
                >
                  {formLoading ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}    </div>
  );
};

export default AdminTrainingEvents;
