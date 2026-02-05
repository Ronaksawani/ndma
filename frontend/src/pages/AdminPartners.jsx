import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { partnerAPI } from "../utils/api";
import styles from "../styles/AdminPartners.module.css";
import { FiSearch } from "react-icons/fi";

const AdminPartners = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await partnerAPI.getAll({ limit: 100, status: "all" });
      setPartners(response.data.partners || []);
      setFilteredPartners(response.data.partners || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPartners(partners);
    } else {
      const filtered = partners.filter(
        (partner) =>
          partner.organizationName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          partner.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredPartners(filtered);
    }
  }, [searchTerm, partners]);

  const handleManage = (partnerId) => {
    navigate(`/admin/partner/${partnerId}`);
  };

  const getPartnerLogoUrl = (organizationName) => {
    // Using placeholder images for now
    const initials = organizationName?.substring(0, 2).toUpperCase() || "P";
    return `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff&size=128`;
  };

  const getPartnerType = (status) => {
    switch (status) {
      case "government":
        return "Government";
      case "ngo":
        return "NGO";
      case "training":
        return "Training Institute";
      default:
        return "Organization";
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar role="admin" />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Partner Organizations</h1>
            <button
              className={styles.addPartnerButton}
              onClick={() => navigate("/admin/add-partner")}
            >
              Add Partner
            </button>
          </div>

          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <p>Loading partners...</p>
          </div>
        ) : (
          <div className={styles.partnersGrid}>
            {filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <div key={partner._id} className={styles.partnerCard}>
                  <div className={styles.cardHeader}>
                    <img
                      src={getPartnerLogoUrl(partner.organizationName)}
                      alt={partner.organizationName}
                      className={styles.partnerLogo}
                    />
                  </div>

                  <div className={styles.cardBody}>
                    <h2 className={styles.partnerName}>
                      {partner.organizationName}
                    </h2>

                    <div className={styles.partnerDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Type:</span>
                        <span className={styles.value}>
                          {partner.organizationType || "Organization"}
                        </span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.label}>Contact:</span>
                        <span className={styles.value}>
                          {partner.email || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <button
                      className={styles.manageButton}
                      onClick={() => handleManage(partner._id)}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noData}>
                <p>No partners found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPartners;
