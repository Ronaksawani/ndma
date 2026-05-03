import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FiBell, FiMenu } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import NotificationPanel from "../components/NotificationPanel";
import { participantAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/Participant.module.css";

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalParticipations: 0,
    certificatesIssued: 0,
    upcomingTrainings: 0,
    statesCovered: 0,
  });
  const [completedTrainings, setCompletedTrainings] = useState([]);
  const [nearbyTrainings, setNearbyTrainings] = useState([]);
  const [notificationPanel, setNotificationPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, profileRes, notificationsRes] = await Promise.all([
          participantAPI.getDashboard(),
          participantAPI.getProfile().catch(() => ({ data: {} })),
          participantAPI.getNotifications().catch(() => ({ data: { notifications: [], unreadCount: 0 } })),
        ]);

        setStats(dashboardRes.data?.stats || {});
        setCompletedTrainings(dashboardRes.data?.myTrainingDetails || []);
        setNearbyTrainings(dashboardRes.data?.nearbyTrainings || dashboardRes.data?.upcomingTrainings || []);
        setProfile(profileRes.data);
        setUnreadCount(notificationsRes.data?.unreadCount || 0);
      } catch (error) {
        console.error("Participant dashboard fetch failed", error);
      }
    };

    fetchData();
  }, []);

  const mappableLocations = useMemo(() => {
    const allLocations = [
      ...completedTrainings.map((item) => ({
        id: item._id,
        title: item.title,
        theme: item.theme,
        district: item.location?.district,
        state: item.location?.state,
        latitude: Number(item.location?.latitude),
        longitude: Number(item.location?.longitude),
        startDate: item.startDate,
        kind: "completed",
      })),
      ...nearbyTrainings.map((item) => ({
        id: item._id,
        title: item.title,
        theme: item.theme,
        district: item.location?.district,
        state: item.location?.state,
        latitude: Number(item.location?.latitude),
        longitude: Number(item.location?.longitude),
        startDate: item.startDate,
        kind: "nearby",
      })),
    ];

    const uniqueLocations = new Map();
    allLocations.forEach((item) => {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
        return;
      }
      if (!uniqueLocations.has(item.id)) {
        uniqueLocations.set(item.id, item);
      }
    });

    return Array.from(uniqueLocations.values());
  }, [completedTrainings, nearbyTrainings]);

  const nearbyDistricts = profile?.nearbyDistricts || [];

  const fullName = profile?.fullName || user?.fullName || "Participant";

  const formatShortDate = (value) => {
    if (!value) return "Date TBA";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date TBA";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
          <h1 className={styles.title}>Participant - {fullName}</h1>
          <div className={styles.headerActions}>
            <button 
              className={styles.notificationButton} 
              aria-label="notifications"
              onClick={() => setNotificationPanel(!notificationPanel)}
            >
              <FiBell size={18} />
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>{unreadCount}</span>
              )}
            </button>
          </div>
        </header>

        <section className={styles.page}>
          {/* Badges Section */}
          <div className={styles.badgesSection}>
            <div className={`${styles.badge} ${styles.badgeAttended}`}>
              <div className={styles.badgeIcon}>🎓</div>
              <div className={styles.badgeContent}>
                <div className={styles.badgeLabel}>Trainings Attended</div>
                <div className={styles.badgeValue}>{stats.totalParticipations || 0}</div>
              </div>
            </div>
            
            <div className={`${styles.badge} ${styles.badgeEarned}`}>
              <div className={styles.badgeIcon}>🏆</div>
              <div className={styles.badgeContent}>
                <div className={styles.badgeLabel}>Certificates Earned</div>
                <div className={styles.badgeValue}>{stats.certificatesIssued || 0}</div>
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Training Locations</h3>
              </div>
              <div className={styles.mapWrap}>
                <MapContainer center={[22.5937, 78.9629]} zoom={4} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {mappableLocations.map((loc) => (
                    <CircleMarker
                      key={loc.id}
                      center={[loc.latitude, loc.longitude]}
                      radius={6}
                      fillColor={loc.kind === "completed" ? "#0ea5e9" : "#16a34a"}
                      color="#ffffff"
                      weight={1}
                      fillOpacity={0.85}
                    >
                      <Popup>
                        <strong>{loc.kind === "completed" ? "Completed" : "Nearby"} Training</strong>
                        <br />
                        {loc.title}
                        <br />
                        {loc.theme}
                        <br />
                        {loc.district}, {loc.state}
                        <br />
                        {new Date(loc.startDate).toLocaleDateString()}
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </article>

            <article className={styles.card}>
              <div className={styles.cardHeaderNearby}>
                <div>
                  <h3 className={styles.cardTitleNearby}>Nearby Trainings</h3>
                  <p className={styles.cardSubtitle}>Training opportunities in your nearby districts</p>
                </div>
                <span className={styles.cardCount}>{nearbyTrainings.length}</span>
              </div>
              <div className={styles.list}>
                {nearbyDistricts.length > 0 && (
                  <div className={styles.panelNote}>
                    Based on: {nearbyDistricts.join(", ")}
                  </div>
                )}
                {nearbyTrainings.slice(0, 12).map((item) => (
                  <div key={item._id} className={styles.item}>
                    <div className={styles.itemTopRow}>
                      <p className={styles.itemTitle}>{item.title}</p>
                      <span className={styles.datePill}>{formatShortDate(item.startDate)}</span>
                    </div>
                    <p className={styles.itemMeta}>
                      {item.theme || "Training"}
                    </p>
                    <div className={styles.itemFooter}>
                      <span className={styles.locationPill}>
                        {item.location?.district || "District TBA"}, {item.location?.state || "State TBA"}
                      </span>
                    </div>
                  </div>
                ))}
                {nearbyTrainings.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyStateTitle}>No nearby trainings found</p>
                    <p className={styles.emptyStateText}>Check back later for new training opportunities.</p>
                  </div>
                ) : null}
              </div>
            </article>
          </div>
        </section>
      </main>

      <NotificationPanel 
        isOpen={notificationPanel} 
        onClose={() => setNotificationPanel(false)}
      />
    </div>
  );
}
