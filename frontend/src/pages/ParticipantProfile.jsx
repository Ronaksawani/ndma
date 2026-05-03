import React, { useEffect, useState } from "react";
import { FiMenu, FiUser, FiMail, FiPhone, FiCalendar, FiMapPin } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { participantAPI } from "../utils/api";
import statesDistrictsData from "../data/statesDistricts.json";
import styles from "../styles/Participant.module.css";

export default function ParticipantProfile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    state: "",
    nearbyDistricts: [],
  });

  const districtsByState = Object.fromEntries(
    statesDistrictsData.states.map((state) => [
      state.label,
      statesDistrictsData.districts[state.value] || [],
    ]),
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await participantAPI.getProfile();
      setProfile(res.data);
      setFormData({
        fullName: res.data?.fullName || "",
        email: res.data?.email || "",
        phone: res.data?.phone || "",
        dateOfBirth: res.data?.dateOfBirth ? res.data.dateOfBirth.split("T")[0] : "",
        gender: res.data?.gender || "",
        state: res.data?.state || "",
        nearbyDistricts: res.data?.nearbyDistricts || [],
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "state") {
      setFormData((prev) => ({
        ...prev,
        state: value,
        nearbyDistricts: [],
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDistrictChange = (district) => {
    setFormData(prev => {
      const districts = prev.nearbyDistricts || [];
      if (districts.includes(district)) {
        return {
          ...prev,
          nearbyDistricts: districts.filter(d => d !== district)
        };
      } else if (districts.length < 3) {
        return {
          ...prev,
          nearbyDistricts: [...districts, district]
        };
      }
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await participantAPI.updateProfile(formData);
      setProfile(res.data.profile);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDistricts = () => {
    return districtsByState[formData.state] || [];
  };

  if (!profile) {
    return (
      <div className={styles.layout}>
        <Sidebar role="participant" />
        <main className={styles.main}>
          <header className={styles.topBar}>
            <h1 className={styles.title}>My Profile</h1>
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
          <h1 className={styles.title}>My Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={styles.editBtn}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </header>
        <section className={styles.page}>
          {isEditing ? (
            <div className={styles.profileFormContainer}>
              <form onSubmit={handleSubmit}>
                <div className={styles.profileFormSection}>
                  <h2 className={styles.profileFormSectionTitle}>Personal Information</h2>
                  <div className={styles.formGridEnhanced}>
                    <div className={styles.formGroupEnhanced}>
                      <label>
                        <FiUser size={16} /> Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className={styles.formGroupEnhanced}>
                      <label>
                        <FiMail size={16} /> Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                      />
                    </div>
                    <div className={styles.formGroupEnhanced}>
                      <label>
                        <FiPhone size={16} /> Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.formGroupEnhanced}>
                      <label>
                        <FiCalendar size={16} /> Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.formGroupEnhanced}>
                      <label>Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <div className={styles.formGroupEnhanced}>
                      <label>
                        <FiMapPin size={16} /> State
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                      >
                        <option value="">Select State</option>
                        {statesDistrictsData.states.map((state) => (
                          <option key={state.value} value={state.label}>{state.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {formData.state && (
                  <div className={styles.profileFormSection}>
                    <h2 className={styles.profileFormSectionTitle}>Nearby Districts</h2>
                    <div className={styles.districtSectionEnhanced}>
                      <h3>Select Up to 3 Nearby Districts</h3>
                      <div className={styles.districtGridEnhanced}>
                        {getAvailableDistricts().map(district => (
                          <label key={district} className={styles.checkboxLabelEnhanced}>
                            <input
                              type="checkbox"
                              checked={formData.nearbyDistricts.includes(district)}
                              onChange={() => handleDistrictChange(district)}
                              disabled={!formData.nearbyDistricts.includes(district) && formData.nearbyDistricts.length >= 3}
                            />
                            {district}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.formActionsEnhanced}>
                  <button 
                    type="button" 
                    className={styles.cancelBtn}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className={styles.submitBtnEnhanced}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatar}>
                  {profile?.fullName
                    ? profile.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"}
                </div>
                <div className={styles.profileHeaderContent}>
                  <h1 className={styles.profileHeaderName}>{profile?.fullName || "User Profile"}</h1>
                  <p className={styles.profileHeaderSubtitle}>
                    {profile?.state ? `${profile.state} • ` : ""}
                    Member since {new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </p>
                  <div className={styles.profileStatsRow}>
                    <div className={styles.profileStatItem}>
                      <span className={styles.profileStatValue}>{profile?.participationsCount || 0}</span>
                      <span className={styles.profileStatLabel}>Participations</span>
                    </div>
                    <div className={styles.profileStatItem}>
                      <span className={styles.profileStatValue}>{profile?.certificatesCount || 0}</span>
                      <span className={styles.profileStatLabel}>Certificates</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.profileFieldsContainer}>
                <div className={styles.profileFieldCard}>
                  <div className={styles.profileFieldIcon}>
                    <FiUser size={20} />
                  </div>
                  <div className={styles.profileFieldContent}>
                    <span className={styles.profileFieldName}>Full Name</span>
                    <span className={styles.profileFieldValue}>{profile?.fullName || "-"}</span>
                  </div>
                </div>

                <div className={styles.profileFieldCard}>
                  <div className={styles.profileFieldIcon}>
                    <FiMail size={20} />
                  </div>
                  <div className={styles.profileFieldContent}>
                    <span className={styles.profileFieldName}>Email</span>
                    <span className={styles.profileFieldValue}>{profile?.email || "-"}</span>
                  </div>
                </div>

                <div className={styles.profileFieldCard}>
                  <div className={styles.profileFieldIcon}>
                    <FiPhone size={20} />
                  </div>
                  <div className={styles.profileFieldContent}>
                    <span className={styles.profileFieldName}>Phone</span>
                    <span className={styles.profileFieldValue}>{profile?.phone || "-"}</span>
                  </div>
                </div>

                <div className={styles.profileFieldCard}>
                  <div className={styles.profileFieldIcon}>
                    <FiCalendar size={20} />
                  </div>
                  <div className={styles.profileFieldContent}>
                    <span className={styles.profileFieldName}>Date of Birth</span>
                    <span className={styles.profileFieldValue}>
                      {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "-"}
                    </span>
                  </div>
                </div>

                <div className={styles.profileFieldCard}>
                  <div className={styles.profileFieldIcon}>
                    👤
                  </div>
                  <div className={styles.profileFieldContent}>
                    <span className={styles.profileFieldName}>Gender</span>
                    <span className={styles.profileFieldValue}>{profile?.gender || "-"}</span>
                  </div>
                </div>

                <div className={styles.profileFieldCard}>
                  <div className={styles.profileFieldIcon}>
                    <FiMapPin size={20} />
                  </div>
                  <div className={styles.profileFieldContent}>
                    <span className={styles.profileFieldName}>State</span>
                    <span className={styles.profileFieldValue}>{profile?.state || "-"}</span>
                  </div>
                </div>

                <div className={styles.profileFieldCard}>
                  <div className={styles.profileFieldIcon}>
                    📍
                  </div>
                  <div className={styles.profileFieldContent}>
                    <span className={styles.profileFieldName}>Nearby Districts</span>
                    <span className={styles.profileFieldValue}>
                      {profile?.nearbyDistricts && profile.nearbyDistricts.length > 0
                        ? profile.nearbyDistricts.join(", ")
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className={styles.profileFieldCard}>
                  <div className={styles.profileFieldIcon}>
                    🆔
                  </div>
                  <div className={styles.profileFieldContent}>
                    <span className={styles.profileFieldName}>Aadhaar Number</span>
                    <span className={styles.profileFieldValue}>{profile?.aadhaarNumber || "-"}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
