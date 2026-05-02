import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Circle,
} from "react-leaflet";
import { analyticsAPI, partnerAPI, trainingAPI } from "../utils/api";
import themeOptions from "../data/themes.json";
import Sidebar from "../components/Sidebar";
import { generateRecommendations } from "../utils/generateRecommendations";
import { getColor, getDisasterFromTheme } from "../utils/recommendationEngine";
import styles from "../styles/AdminDashboard.module.css";
import {
  FiBarChart2,
  FiUsers,
  FiMapPin,
  FiBell,
  FiFilter,
} from "react-icons/fi";
import disasterRiskData from "../data/disaster_risk_dataset_india.json";
import districtCoordsData from "../data/district_coords.json";

const DISASTER_OPTIONS = [
  "Flood",
  "Cyclone",
  "Earthquake",
  "Drought",
  "Landslide",
  "Heatwave",
];

const STATE_ANCHORS = {
  Assam: [26.2006, 92.9376],
  Bihar: [25.0961, 85.3131],
  "Uttar Pradesh": [26.8467, 80.9462],
  "West Bengal": [22.9868, 87.855],
  Maharashtra: [19.7515, 75.7139],
  Kerala: [10.8505, 76.2711],
  Odisha: [20.9517, 85.0985],
  "Andhra Pradesh": [15.9129, 79.74],
  "Tamil Nadu": [11.1271, 78.6569],
  Gujarat: [22.2587, 71.1924],
  "Jammu & Kashmir / Ladakh": [34.1526, 77.577],
  "Himachal Pradesh": [31.1048, 77.1734],
  Uttarakhand: [30.0668, 79.0193],
  "North-East": [25.467, 91.3662],
  "Delhi NCR": [28.6139, 77.209],
  Rajasthan: [27.0238, 74.2179],
  Karnataka: [15.3173, 75.7139],
  Telangana: [18.1124, 79.0193],
};

const normalizeText = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getHeatColor = (riskLevel) => {
  if (riskLevel === "HIGH") return "#dc2626";
  if (riskLevel === "MEDIUM") return "#f59e0b";
  return "#16a34a";
};

const getMonthDiff = (dateString) => {
  if (!dateString) return null;
  const diffMs = Date.now() - new Date(dateString).getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 30);
};

const getFallbackPoint = (state, district, index) => {
  const anchor = STATE_ANCHORS[state] || [22.5937, 78.9629];
  const hash = normalizeText(`${state}${district}`)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const angle = (hash % 360) * (Math.PI / 180);
  const ring = 0.28 + (index % 4) * 0.18;
  return [
    anchor[0] + Math.sin(angle) * ring,
    anchor[1] + Math.cos(angle) * ring,
  ];
};

const isTrainingInPeriod = (trainingDate, period) => {
  if (period === "all") return true;

  const now = new Date();
  const trainingDateObj = new Date(trainingDate);

  let cutoffDate = new Date(now);

  if (period === "1month") {
    cutoffDate.setMonth(cutoffDate.getMonth() - 1);
  } else if (period === "3months") {
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);
  } else if (period === "6months") {
    cutoffDate.setMonth(cutoffDate.getMonth() - 6);
  } else if (period === "1year") {
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
  }

  return trainingDateObj >= cutoffDate;
};

const RECENT_ACTIVITY_SEEN_STORAGE_KEY = "ndma_admin_seen_recent_activities";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTrainings: 0,
    totalParticipants: 0,
    statesCovered: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [trainingLocations, setTrainingLocations] = useState([]);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActivitiesPanel, setShowActivitiesPanel] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState("");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTrainings, setShowTrainings] = useState(true);
  const [recommendationStateFilter, setRecommendationStateFilter] =
    useState("all");
  const [showRecommendationFilterDrawer, setShowRecommendationFilterDrawer] =
    useState(false);
  const [focusedRecommendationKey, setFocusedRecommendationKey] =
    useState(null);
  const [isolatedZoneKey, setIsolatedZoneKey] = useState(null);
  const [selectedRecommendationKey, setSelectedRecommendationKey] =
    useState(null);
  const [showAllRecommendationPoints, setShowAllRecommendationPoints] =
    useState(false);
  const [seenRecentActivityKeys, setSeenRecentActivityKeys] = useState(() => {
    try {
      const raw = localStorage.getItem(RECENT_ACTIVITY_SEEN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const mapRef = useRef(null);
  const recommendationPanelRef = useRef(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    state: "all",
    theme: "all",
    period: "all",
  });

  const recommendationInputs = useMemo(
    () =>
      trainingHistory
        .map((training) => ({
          district: training.location?.district,
          disaster: getDisasterFromTheme(training.theme),
          date: training.startDate,
        }))
        .filter((training) => training.district && training.disaster),
    [trainingHistory],
  );

  const recommendations = useMemo(
    () => generateRecommendations(recommendationInputs),
    [recommendationInputs],
  );

  const recommendationLookup = useMemo(() => {
    const lookup = new Map();

    recommendations.forEach((item) => {
      lookup.set(item.key, item);
    });

    return lookup;
  }, [recommendations]);

  const recommendationStates = useMemo(
    () =>
      [
        ...new Set(recommendations.map((item) => item.state).filter(Boolean)),
      ].sort(),
    [recommendations],
  );

  const scopedRecommendations = useMemo(
    () =>
      recommendations.filter(
        (item) =>
          recommendationStateFilter === "all" ||
          item.state === recommendationStateFilter,
      ),
    [recommendations, recommendationStateFilter],
  );

  const priorityRecommendations = useMemo(() => {
    const maxCards = 10;
    const maxPerDisaster = 2;

    const sorted = [...scopedRecommendations]
      .filter((item) => item.priority !== "Low")
      .filter(
        (item) => selectedDisaster === "" || item.disaster === selectedDisaster,
      )
      .sort((a, b) => b.score - a.score);

    if (selectedDisaster !== "" && recommendationStateFilter === "all") {
      const recommendationsByState = new Map();

      sorted.forEach((item) => {
        if (!recommendationsByState.has(item.state)) {
          recommendationsByState.set(item.state, []);
        }
        recommendationsByState.get(item.state).push(item);
      });

      const states = Array.from(recommendationsByState.keys());
      const picked = [];
      let roundIndex = 0;

      while (picked.length < maxCards) {
        let addedInRound = false;

        states.forEach((state) => {
          if (picked.length >= maxCards) {
            return;
          }

          const items = recommendationsByState.get(state) || [];
          if (roundIndex < items.length) {
            picked.push(items[roundIndex]);
            addedInRound = true;
          }
        });

        if (!addedInRound) {
          break;
        }

        roundIndex += 1;
      }

      return picked;
    }

    if (recommendationStateFilter !== "all") {
      return sorted.slice(0, maxCards);
    }

    const uniqueStateDisasterRecommendations = [];
    const seenStateDisaster = new Set();

    for (const item of sorted) {
      const pairKey = `${item.state}::${item.disaster}`;
      if (seenStateDisaster.has(pairKey)) {
        continue;
      }

      seenStateDisaster.add(pairKey);
      uniqueStateDisasterRecommendations.push(item);
    }

    const picked = [];
    const disasterCount = new Map();

    for (const item of uniqueStateDisasterRecommendations) {
      const current = disasterCount.get(item.disaster) || 0;
      if (current >= maxPerDisaster) {
        continue;
      }

      picked.push(item);
      disasterCount.set(item.disaster, current + 1);

      if (picked.length === maxCards) {
        return picked;
      }
    }

    for (const item of uniqueStateDisasterRecommendations) {
      if (picked.length === maxCards) {
        break;
      }
      if (!picked.includes(item)) {
        picked.push(item);
      }
    }

    return picked;
  }, [scopedRecommendations, selectedDisaster, recommendationStateFilter]);

  const filteredRecommendationsForMap = useMemo(
    () =>
      [...scopedRecommendations]
        .filter((item) => item.priority !== "Low")
        .filter(
          (item) =>
            selectedDisaster === "" || item.disaster === selectedDisaster,
        )
        .sort((a, b) => b.score - a.score),
    [scopedRecommendations, selectedDisaster],
  );

  const recommendationCounts = useMemo(
    () => ({
      high: scopedRecommendations.filter((item) => item.priority === "High")
        .length,
      medium: scopedRecommendations.filter((item) => item.priority === "Medium")
        .length,
      low: scopedRecommendations.filter((item) => item.priority === "Low")
        .length,
    }),
    [scopedRecommendations],
  );

  const seenRecentActivityKeySet = useMemo(
    () => new Set(seenRecentActivityKeys),
    [seenRecentActivityKeys],
  );

  const unreadRecentActivitiesCount = useMemo(
    () =>
      recentActivities.filter(
        (activity) => !seenRecentActivityKeySet.has(activity.activityKey),
      ).length,
    [recentActivities, seenRecentActivityKeySet],
  );

  const mappableLocations = useMemo(
    () =>
      filteredLocations
        .map((location) => ({
          ...location,
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
        }))
        .filter(
          (location) =>
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude),
        ),
    [filteredLocations],
  );

  const districtCoordinateLookup = useMemo(() => {
    const map = new Map();

    trainingHistory.forEach((training) => {
      const district = training.location?.district;
      const lat = Number(training.location?.latitude);
      const lng = Number(training.location?.longitude);

      if (!district || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      const key = normalizeText(district);
      const existing = map.get(key);

      if (existing) {
        existing.lat += lat;
        existing.lng += lng;
        existing.count += 1;
      } else {
        map.set(key, { lat, lng, count: 1 });
      }
    });

    return map;
  }, [trainingHistory]);

  const heatmapZones = useMemo(() => {
    const zonesByDisaster = disasterRiskData[selectedDisaster] || {};
    const zones = [];

    Object.entries(zonesByDisaster).forEach(([state, riskBandGroups]) => {
      const allDistricts = [
        ...(riskBandGroups.high || []),
        ...(riskBandGroups.moderate || []),
      ];

      allDistricts.forEach((district, index) => {
        const matchingTrainings = trainingHistory.filter((training) => {
          const trainingDistrict = normalizeText(training.location?.district);
          const trainingDisaster = getDisasterFromTheme(training.theme);
          return (
            trainingDistrict === normalizeText(district) &&
            trainingDisaster === selectedDisaster
          );
        });

        const sortedByDate = [...matchingTrainings].sort(
          (a, b) => new Date(b.startDate) - new Date(a.startDate),
        );
        const lastTraining = sortedByDate[0];
        const monthsSinceLast = getMonthDiff(lastTraining?.startDate);

        let timeScore = 50;
        if (monthsSinceLast !== null && monthsSinceLast < 3) {
          timeScore = 10;
        } else if (monthsSinceLast !== null && monthsSinceLast <= 6) {
          timeScore = 30;
        }

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const participantsCovered = matchingTrainings
          .filter((training) => new Date(training.startDate) >= sixMonthsAgo)
          .reduce(
            (sum, training) => sum + (Number(training.participantsCount) || 0),
            0,
          );

        let participantScore = 30;
        if (participantsCovered >= 200) {
          participantScore = 10;
        } else if (participantsCovered >= 50) {
          participantScore = 20;
        }

        const riskScore = timeScore + participantScore;
        const riskLevel =
          riskScore >= 70 ? "HIGH" : riskScore >= 45 ? "MEDIUM" : "LOW";

        let center;
        const verifiedCoord = districtCoordsData.entries?.find(
          (entry) =>
            normalizeText(entry.district) === normalizeText(district) &&
            normalizeText(entry.state) === normalizeText(state),
        );

        if (verifiedCoord) {
          center = [verifiedCoord.latitude, verifiedCoord.longitude];
        } else {
          const coordinateEntry = districtCoordinateLookup.get(
            normalizeText(district),
          );
          center = coordinateEntry
            ? [
                coordinateEntry.lat / coordinateEntry.count,
                coordinateEntry.lng / coordinateEntry.count,
              ]
            : getFallbackPoint(state, district, index);
        }

        const reasons = [];
        if (!lastTraining) {
          reasons.push("No training conducted yet for this disaster.");
        } else if (monthsSinceLast > 6) {
          reasons.push(
            `No training in last ${Math.floor(monthsSinceLast)} months.`,
          );
        } else if (monthsSinceLast >= 3) {
          reasons.push("Training frequency is moderate (3-6 month gap).");
        } else {
          reasons.push("Training happened recently (<3 months).");
        }

        reasons.push(
          participantsCovered < 50
            ? `Only ${participantsCovered} participants trained in last 6 months.`
            : participantsCovered <= 200
              ? `${participantsCovered} participants trained, coverage is moderate.`
              : `${participantsCovered} participants trained, coverage is strong.`,
        );

        if (riskBandGroups.high?.includes(district)) {
          reasons.push("District is in high baseline hazard category.");
        } else {
          reasons.push("District is in moderate baseline hazard category.");
        }

        zones.push({
          key: `${selectedDisaster}::${state}::${district}`,
          state,
          district,
          center,
          riskScore,
          riskLevel,
          reasons,
        });
      });
    });

    return zones;
  }, [districtCoordinateLookup, trainingHistory, selectedDisaster]);

  const getLocationRecommendation = (location) => {
    const disaster = getDisasterFromTheme(location.theme);

    if (!disaster) {
      return null;
    }

    return recommendationLookup.get(
      [location.state || "", location.district || "", disaster].join("::"),
    );
  };

  const highlightPopupKeywords = (text) => {
    const keywords = [
      selectedDisaster,
      "No training",
      "participants",
      "coverage",
      "high baseline hazard category",
      "moderate baseline hazard category",
      "recently",
      "months",
      "weeks",
      "month",
      "quarter",
      "HIGH",
      "MEDIUM",
      "LOW",
    ]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    const escaped = keywords.map((keyword) =>
      keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );

    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = text.split(regex).filter(Boolean);

    return parts.map((part, index) => {
      const isKeyword = keywords.some(
        (keyword) => keyword.toLowerCase() === part.toLowerCase(),
      );
      const isDisasterType =
        selectedDisaster &&
        selectedDisaster.toLowerCase() === part.toLowerCase();

      return isKeyword ? (
        <span
          key={`${part}-${index}`}
          className={
            isDisasterType ? styles.popupDisasterKeyword : styles.popupKeyword
          }
        >
          {part}
        </span>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      );
    });
  };

  const buildRecommendationHeatmapZones = (recommendationList) => {
    const zoneMap = new Map();

    recommendationList.forEach((item, index) => {
      const zoneKey = `${item.disaster}::${item.state}::${item.district}`;
      if (zoneMap.has(zoneKey)) {
        return;
      }

      const verifiedCoord = districtCoordsData.entries?.find(
        (entry) =>
          normalizeText(entry.district) === normalizeText(item.district) &&
          normalizeText(entry.state) === normalizeText(item.state),
      );

      const coordinateEntry = districtCoordinateLookup.get(
        normalizeText(item.district),
      );

      const center = verifiedCoord
        ? [verifiedCoord.latitude, verifiedCoord.longitude]
        : coordinateEntry
          ? [
              coordinateEntry.lat / coordinateEntry.count,
              coordinateEntry.lng / coordinateEntry.count,
            ]
          : getFallbackPoint(item.state, item.district, index);

      const riskLevel =
        item.priority === "High"
          ? "HIGH"
          : item.priority === "Medium"
            ? "MEDIUM"
            : "LOW";

      zoneMap.set(zoneKey, {
        key: zoneKey,
        state: item.state,
        district: item.district,
        disaster: item.disaster,
        center,
        riskScore: Number(item.score.toFixed(1)),
        riskLevel,
        reasons: [
          `Priority ${item.priority} recommendation for ${item.disaster} preparedness in this district.`,
        ],
        recommendationText: item.recommendation,
      });
    });

    return Array.from(zoneMap.values());
  };

  const recommendationHeatmapZones = useMemo(
    () => buildRecommendationHeatmapZones(priorityRecommendations),
    [districtCoordinateLookup, priorityRecommendations],
  );

  const allRecommendationHeatmapZones = useMemo(
    () => buildRecommendationHeatmapZones(filteredRecommendationsForMap),
    [districtCoordinateLookup, filteredRecommendationsForMap],
  );

  const visibleHeatmapZones = useMemo(() => {
    const sourceZones = showAllRecommendationPoints
      ? allRecommendationHeatmapZones
      : recommendationHeatmapZones;

    if (isolatedZoneKey) {
      const isolatedZone =
        sourceZones.find((zone) => zone.key === isolatedZoneKey) ||
        heatmapZones.find((zone) => zone.key === isolatedZoneKey);
      if (isolatedZone) {
        return [isolatedZone];
      }
    }

    if (sourceZones.length === 0) {
      return [];
    }

    return sourceZones;
  }, [
    allRecommendationHeatmapZones,
    heatmapZones,
    isolatedZoneKey,
    recommendationHeatmapZones,
    showAllRecommendationPoints,
  ]);

  const getZoneKeyFromRecommendation = (item) =>
    `${item.disaster}::${item.state}::${item.district}`;

  const handleRecommendationClick = (item) => {
    const zoneKey = getZoneKeyFromRecommendation(item);
    setShowHeatmap(true);
    setShowTrainings(false);
    setSelectedDisaster(item.disaster);
    setIsolatedZoneKey(zoneKey);
    setFocusedRecommendationKey(zoneKey);
    setSelectedRecommendationKey(item.key);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        recommendationPanelRef.current &&
        !recommendationPanelRef.current.contains(event.target)
      ) {
        setSelectedRecommendationKey(null);
        setIsolatedZoneKey(null);
        setShowTrainings(true);
      }
    };

    if (selectedRecommendationKey) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [selectedRecommendationKey]);

  useEffect(() => {
    if (!focusedRecommendationKey || !mapRef.current) {
      return;
    }

    const zone = heatmapZones.find(
      (item) => item.key === focusedRecommendationKey,
    );

    if (!zone) {
      return;
    }

    const map = mapRef.current;
    map.flyTo(zone.center, Math.max(map.getZoom(), 7), { duration: 0.8 });
  }, [focusedRecommendationKey, heatmapZones]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      RECENT_ACTIVITY_SEEN_STORAGE_KEY,
      JSON.stringify(seenRecentActivityKeys),
    );
  }, [seenRecentActivityKeys]);

  // Apply filters to locations
  useEffect(() => {
    let filtered = trainingLocations;

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter((loc) => loc.status === filters.status);
    }

    // Filter by state
    if (filters.state !== "all") {
      filtered = filtered.filter((loc) => loc.state === filters.state);
    }

    // Filter by theme
    if (filters.theme !== "all") {
      filtered = filtered.filter((loc) => loc.theme === filters.theme);
    }

    // Filter by period
    if (filters.period !== "all") {
      filtered = filtered.filter((loc) =>
        isTrainingInPeriod(loc.startDate, filters.period),
      );
    }

    setFilteredLocations(filtered);
  }, [trainingLocations, filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, locationsRes, trainingsRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getTrainingLocations(),
        trainingAPI.getAll({ limit: 1000 }),
      ]);

      setStats({
        totalTrainings: dashboardRes.data.stats.totalTrainings,
        totalParticipants: dashboardRes.data.stats.totalParticipants,
        statesCovered: dashboardRes.data.stats.statesCovered,
      });
      setTrainingHistory(trainingsRes.data.trainings || []);
      setTrainingLocations(locationsRes.data || []);

      const trainings = trainingsRes.data.trainings || [];
      const pendingTrainingActivities = trainings
        .filter((training) => training.status === "pending")
        .map((training) => ({
          id: training._id,
          activityKey: `training:${training._id}`,
          title: training.title,
          type: "Training Approval",
          timestamp: new Date(training.createdAt),
          partner: training.partnerId?.organizationName || "Unknown",
          actionPath: `/admin/training/${training._id}`,
        }));

      // Fetch pending partner requests
      try {
        const partnersRes = await partnerAPI.getAll({ status: "pending" });
        const pendingPartners = partnersRes.data.partners || [];

        const pendingActivities = pendingPartners.map((partner) => ({
          id: partner._id,
          activityKey: `partner:${partner._id}`,
          title: `New Partner Request: ${partner.organizationName}`,
          type: "Partner Request",
          timestamp: new Date(partner.createdAt),
          partner: partner.organizationName,
          actionPath: null,
        }));

        // Combine and sort by timestamp (newest first)
        const allActivities = [
          ...pendingTrainingActivities,
          ...pendingActivities,
        ].sort((a, b) => b.timestamp - a.timestamp);

        setRecentActivities(allActivities);
      } catch (err) {
        console.error("Error fetching pending partners:", err);
        setRecentActivities(pendingTrainingActivities);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  const handleRecentActivityClick = (activity) => {
    if (!seenRecentActivityKeySet.has(activity.activityKey)) {
      setSeenRecentActivityKeys((prev) => [
        ...new Set([...prev, activity.activityKey]),
      ]);
    }

    if (activity.actionPath) {
      setShowActivitiesPanel(false);
      navigate(activity.actionPath);
    }
  };

  if (loading) {
    return (
      <div className={styles.adminLayout}>
        <Sidebar role="admin" />
        <div className={styles.dashboardContainer}>
          <div className={styles.loadingState}>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <Sidebar role="admin" />
      <div className={styles.dashboardContainer}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <h2 className={styles.topBarTitle}>NDMA Admin Dashboard</h2>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.notificationButton}
              title="Recent activities"
              onClick={() => setShowActivitiesPanel((prev) => !prev)}
            >
              <FiBell />
              {unreadRecentActivitiesCount > 0 && (
                <span className={styles.notificationCount}>
                  {Math.min(unreadRecentActivitiesCount, 9)}
                </span>
              )}
              <span className={styles.notificationTooltip}>
                Recent Activities
              </span>
            </button>
          </div>
        </div>

        <div className={styles.mainContentWrapper}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          {/* Statistics Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiBarChart2 />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Trainings</p>
                <h2 className={styles.statValue}>{stats.totalTrainings}</h2>
              </div>
              <div className={styles.chart}>
                <div className={styles.barChart}>
                  <div className={styles.bar} style={{ height: "40%" }}></div>
                  <div className={styles.bar} style={{ height: "60%" }}></div>
                  <div className={styles.bar} style={{ height: "80%" }}></div>
                  <div className={styles.bar} style={{ height: "50%" }}></div>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiUsers />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Volunteer Trained</p>
                <h2 className={styles.statValue}>
                  {(stats.totalParticipants / 1000).toFixed(1)}K+
                </h2>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiMapPin />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>States Covered</p>
                <h2 className={styles.statValue}>{stats.statesCovered}</h2>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
            <div className={styles.mapRecommendationLayout}>
              {/* Map Section */}
              <div className={styles.mapSection}>
                <div className={styles.mapHeader}>
                  <h3>Training Locations</h3>
                  <div className={styles.mapHeaderActions}>
                    <button
                      type="button"
                      className={styles.filterToggleButton}
                      onClick={() => setShowFilterDrawer((prev) => !prev)}
                      aria-expanded={showFilterDrawer}
                      aria-label="Toggle filters"
                    >
                      <FiFilter />
                    </button>
                  </div>
                </div>

                <div className={styles.mapStage}>
                  <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={4}
                    whenCreated={(mapInstance) => {
                      mapRef.current = mapInstance;
                    }}
                    className={styles.mapContainer}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    {showHeatmap &&
                      visibleHeatmapZones.map((zone) => (
                        <Circle
                          key={zone.key}
                          eventHandlers={{
                            add: (e) => {
                              if (zone.key !== focusedRecommendationKey) {
                                return;
                              }

                              e.target.openPopup();

                              if (mapRef.current) {
                                mapRef.current.panTo(zone.center, {
                                  animate: true,
                                  duration: 0.35,
                                });
                              }

                              setFocusedRecommendationKey(null);
                            },
                          }}
                          center={zone.center}
                          radius={22000 + zone.riskScore * 900}
                          pathOptions={{
                            fillColor: getHeatColor(zone.riskLevel),
                            color: getHeatColor(zone.riskLevel),
                            weight: 2,
                            opacity: 0.7,
                            fillOpacity: 0.4,
                          }}
                        >
                          <Popup>
                            <div className={styles.heatmapPopup}>
                              <h4>
                                {zone.district}, {zone.state}
                              </h4>
                              <p>
                                <strong>Risk Level:</strong>{" "}
                                <span
                                  style={{
                                    color: getHeatColor(zone.riskLevel),
                                  }}
                                >
                                  {zone.riskLevel}
                                </span>
                              </p>
                              <p>
                                <strong>Reasons:</strong>
                              </p>
                              <ul>
                                {zone.reasons.map((reason, idx) => (
                                  <li key={idx}>
                                    {highlightPopupKeywords(reason)}
                                  </li>
                                ))}
                              </ul>
                              <p>
                                <strong>Recommendation:</strong>{" "}
                                {highlightPopupKeywords(
                                  zone.recommendationText ||
                                    (zone.riskLevel === "HIGH"
                                      ? `Conduct ${zone.disaster || selectedDisaster} training within 2 weeks.`
                                      : zone.riskLevel === "MEDIUM"
                                        ? `Plan ${zone.disaster || selectedDisaster} training within 1 month.`
                                        : `Maintain periodic ${zone.disaster || selectedDisaster} drills every quarter.`),
                                )}
                              </p>
                            </div>
                          </Popup>
                        </Circle>
                      ))}
                    {showTrainings &&
                      mappableLocations.map((location) => {
                        const recommendation =
                          getLocationRecommendation(location);
                        const priority = recommendation?.priority || "Low";

                        return (
                          <CircleMarker
                            key={location.id}
                            center={[location.latitude, location.longitude]}
                            radius={6}
                            pathOptions={{
                              fillColor: getColor(priority),
                              color: "#ffffff",
                              weight: 2,
                              opacity: 1,
                              fillOpacity: 0.85,
                            }}
                          >
                            <Popup>
                              <div className={styles.popupContent}>
                                <h4>{location.title}</h4>
                                <p>
                                  <strong>Location:</strong> {location.city},{" "}
                                  {location.state}
                                </p>
                                <p>
                                  <strong>Partner:</strong>{" "}
                                  {location.partnerName}
                                </p>
                                <p>
                                  <strong>Date:</strong>{" "}
                                  {new Date(
                                    location.startDate,
                                  ).toLocaleDateString()}
                                </p>
                                {recommendation && (
                                  <p>
                                    <strong>Recommendation:</strong>{" "}
                                    {recommendation.recommendation}
                                  </p>
                                )}
                              </div>
                            </Popup>
                          </CircleMarker>
                        );
                      })}
                  </MapContainer>

                  {mappableLocations.length === 0 && (
                    <div className={styles.noDataOverlay}>
                      <p>No training locations with coordinates available</p>
                    </div>
                  )}
                </div>

                {showFilterDrawer && (
                  <button
                    type="button"
                    className={styles.filterBackdrop}
                    aria-label="Close filters"
                    onClick={() => setShowFilterDrawer(false)}
                  />
                )}

                <aside
                  className={`${styles.filterDrawer} ${showFilterDrawer ? styles.filterDrawerOpen : ""}`}
                  aria-hidden={!showFilterDrawer}
                >
                  <div className={styles.filterDrawerHeader}>
                    <h4>Filters</h4>
                    <button
                      type="button"
                      className={styles.filterDrawerCloseButton}
                      onClick={() => setShowFilterDrawer(false)}
                      aria-label="Close filters"
                    >
                      x
                    </button>
                  </div>

                  <div className={styles.filterDrawerBody}>
                    <div className={styles.filterDrawerField}>
                      <label>Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                      >
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div className={styles.filterDrawerField}>
                      <label>State</label>
                      <select
                        value={filters.state}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            state: e.target.value,
                          }))
                        }
                      >
                        <option value="all">All States</option>
                        {[
                          ...new Set(
                            trainingLocations
                              .map((loc) => loc.state)
                              .filter(Boolean),
                          ),
                        ].map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.filterDrawerField}>
                      <label>Theme</label>
                      <select
                        value={filters.theme}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            theme: e.target.value,
                          }))
                        }
                      >
                        <option value="all">All Themes</option>
                        {themeOptions.map((theme) => (
                          <option key={theme.value} value={theme.value}>
                            {theme.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.filterDrawerField}>
                      <label>Period</label>
                      <select
                        value={filters.period}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            period: e.target.value,
                          }))
                        }
                      >
                        <option value="all">All Time</option>
                        <option value="1month">Last 1 Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="1year">Last 1 Year</option>
                      </select>
                    </div>

                    <div className={styles.filterDrawerField}>
                      <label className={styles.filterDrawerCheckbox}>
                        <input
                          type="checkbox"
                          checked={showTrainings}
                          onChange={(e) => setShowTrainings(e.target.checked)}
                        />
                        Show Trainings
                      </label>
                    </div>
                  </div>
                </aside>
              </div>

              <div className={styles.recommendationSection}>
                <div className={styles.recommendationHeader}>
                  <h3>Training Recommendations</h3>
                  <button
                    type="button"
                    className={styles.recommendationFilterToggleButton}
                    onClick={() =>
                      setShowRecommendationFilterDrawer((prev) => !prev)
                    }
                    aria-expanded={showRecommendationFilterDrawer}
                    aria-label="Toggle recommendation filters"
                  >
                    <FiFilter />
                  </button>
                </div>

                {showRecommendationFilterDrawer && (
                  <button
                    type="button"
                    className={styles.recommendationFilterBackdrop}
                    aria-label="Close recommendation filters"
                    onClick={() => setShowRecommendationFilterDrawer(false)}
                  />
                )}

                <aside
                  className={`${styles.recommendationFilterDrawer} ${showRecommendationFilterDrawer ? styles.recommendationFilterDrawerOpen : ""}`}
                  aria-hidden={!showRecommendationFilterDrawer}
                >
                  <div className={styles.recommendationFilterDrawerHeader}>
                    <h4>Recommendation Filters</h4>
                    <button
                      type="button"
                      className={styles.recommendationFilterDrawerCloseButton}
                      onClick={() => setShowRecommendationFilterDrawer(false)}
                      aria-label="Close recommendation filters"
                    >
                      x
                    </button>
                  </div>

                  <div className={styles.recommendationFilterDrawerBody}>
                    <div className={styles.recommendationFilterDrawerField}>
                      <label htmlFor="admin-recommendation-state-filter">
                        State
                      </label>
                      <select
                        id="admin-recommendation-state-filter"
                        value={recommendationStateFilter}
                        onChange={(e) =>
                          setRecommendationStateFilter(e.target.value)
                        }
                      >
                        <option value="all">All States</option>
                        {recommendationStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.recommendationFilterDrawerField}>
                      <label>Disaster Type</label>
                      <select
                        value={selectedDisaster}
                        onChange={(e) => {
                          setSelectedDisaster(e.target.value);
                          setSelectedRecommendationKey(null);
                          setIsolatedZoneKey(null);
                          setFocusedRecommendationKey(null);
                          setShowTrainings(true);
                        }}
                      >
                        <option value="">None</option>
                        {DISASTER_OPTIONS.map((disaster) => (
                          <option key={disaster} value={disaster}>
                            {disaster}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.recommendationFilterDrawerField}>
                      <label
                        className={styles.recommendationFilterDrawerCheckbox}
                      >
                        <input
                          type="checkbox"
                          checked={showHeatmap}
                          onChange={(e) => setShowHeatmap(e.target.checked)}
                        />
                        Show Risk Heatmap
                      </label>
                    </div>
                  </div>
                </aside>

                <div
                  className={styles.recommendationGrid}
                  ref={recommendationPanelRef}
                >
                  {priorityRecommendations.length > 0 ? (
                    priorityRecommendations.map((item) => (
                      <div
                        key={item.key}
                        className={`${styles.recommendationCard} ${styles.recommendationCardClickable} ${selectedRecommendationKey === item.key ? styles.recommendationCardSelected : ""}`}
                        onClick={() => handleRecommendationClick(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRecommendationClick(item);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={styles.recommendationCardHeader}>
                          <div>
                            <p className={styles.recommendationLocation}>
                              {item.district}, {item.state}
                            </p>
                            <h4>{item.recommendation}</h4>
                          </div>
                          <span
                            className={`${styles.priorityBadge} ${styles[`priority${item.priority}`]}`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <p className={styles.recommendationMeta}>
                          <strong>{item.disaster}</strong> risk
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className={styles.recommendationEmpty}>
                      No high-priority recommendations yet.
                    </div>
                  )}

                  {filteredRecommendationsForMap.length > 0 && (
                    <label className={styles.recommendationMapToggle}>
                      <input
                        type="checkbox"
                        checked={showAllRecommendationPoints}
                        onChange={(e) => {
                          setShowAllRecommendationPoints(e.target.checked);
                          setShowHeatmap(true);
                          setIsolatedZoneKey(null);
                          setSelectedRecommendationKey(null);
                          setFocusedRecommendationKey(null);
                        }}
                      />
                      Show all points on map (
                      {filteredRecommendationsForMap.length})
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showActivitiesPanel && (
            <button
              type="button"
              className={styles.panelBackdrop}
              aria-label="Close recent activities"
              onClick={() => setShowActivitiesPanel(false)}
            />
          )}

          <aside
            className={`${styles.activitiesDrawer} ${showActivitiesPanel ? styles.activitiesDrawerOpen : ""}`}
            aria-hidden={!showActivitiesPanel}
          >
            <div className={styles.activitiesHeader}>
              <h3>
                <FiBell /> Recent Activities
              </h3>
              <button
                type="button"
                className={styles.closeDrawerButton}
                onClick={() => setShowActivitiesPanel(false)}
                aria-label="Close panel"
              >
                x
              </button>
            </div>

            <div className={styles.activitiesList}>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <button
                    key={activity.activityKey}
                    type="button"
                    className={`${styles.activityItem} ${activity.actionPath ? styles.activityItemClickable : ""} ${!seenRecentActivityKeySet.has(activity.activityKey) ? styles.activityItemUnread : ""}`}
                    onClick={() => handleRecentActivityClick(activity)}
                  >
                    <div className={styles.activityDot}></div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityTitle}>
                        {activity.title}
                        {!seenRecentActivityKeySet.has(
                          activity.activityKey,
                        ) && (
                          <span className={styles.activityNewBadge}>NEW</span>
                        )}
                      </p>
                      <p className={styles.activityMeta}>
                        {activity.partner} • {activity.type}
                      </p>
                    </div>
                    <p className={styles.activityTime}>
                      {getTimeAgo(activity.timestamp)}
                    </p>
                  </button>
                ))
              ) : (
                <p className={styles.noActivities}>No recent activities</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
