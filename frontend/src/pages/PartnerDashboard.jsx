import React, { useMemo, useState, useEffect, useRef } from "react";
import { FiBarChart2, FiCheck, FiClock, FiFilter, FiMap } from "react-icons/fi";
import {
  MapContainer,
  TileLayer,
  Popup,
  Circle,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { trainingAPI } from "../utils/api";
import disasterRiskData from "../data/disaster_risk_dataset_india.json";
import districtCoordsData from "../data/district_coords.json";
import { generateRecommendations } from "../utils/generateRecommendations";
import { getColor, getDisasterFromTheme } from "../utils/recommendationEngine";
import styles from "../styles/Dashboard.module.css";

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

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
  });
  const [trainings, setTrainings] = useState([]);
  const [allTrainings, setAllTrainings] = useState([]);
  const [globalTrainings, setGlobalTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    theme: "all",
    search: "",
  });
  const [selectedDisaster, setSelectedDisaster] = useState("Earthquake");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTrainings, setShowTrainings] = useState(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showRecommendationFilterDrawer, setShowRecommendationFilterDrawer] =
    useState(false);
  const [recommendationStateFilter, setRecommendationStateFilter] =
    useState("all");
  const [focusedRecommendationKey, setFocusedRecommendationKey] =
    useState(null);
  const [isolatedZoneKey, setIsolatedZoneKey] = useState(null);
  const mapRef = useRef(null);

  const themes = [
    "Flood Management",
    "Earthquake Safety",
    "Cyclone Management",
    "First Aid",
    "Fire Safety",
  ];

  const recommendationInputs = useMemo(
    () =>
      globalTrainings
        .map((training) => ({
          district: training.location?.district,
          disaster: getDisasterFromTheme(training.theme),
          date: training.startDate,
        }))
        .filter((training) => training.district && training.disaster),
    [globalTrainings],
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

  const topRecommendations = useMemo(() => {
    const maxCards = 5;
    const maxPerDisaster = 2;

    const sorted = [...scopedRecommendations]
      .filter((item) => item.priority !== "Low")
      .sort((a, b) => b.score - a.score);

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
  }, [scopedRecommendations]);

  const getTrainingRecommendation = (training) => {
    const disaster = getDisasterFromTheme(training.theme);

    if (!disaster) {
      return null;
    }

    return recommendationLookup.get(
      [
        training.location?.state || "",
        training.location?.district || "",
        disaster,
      ].join("::"),
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [partnerResponse, globalResponse] = await Promise.all([
        trainingAPI.getAll({
          partnerId: user?.organizationId,
          limit: 1000,
        }),
        trainingAPI.getAll({ status: "approved", limit: 5000 }),
      ]);

      const data = partnerResponse.data.trainings || [];
      setAllTrainings(data);
      setTrainings(data.slice(0, 5)); // Recent submissions
      setGlobalTrainings(globalResponse.data.trainings || []);

      setStats({
        total: data.length,
        pending: data.filter((t) => t.status === "pending").length,
        approved: data.filter((t) => t.status === "approved").length,
      });
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrainings = allTrainings.filter((training) => {
    const matchesStatus =
      filters.status === "all" || training.status === filters.status;
    const matchesTheme =
      filters.theme === "all" || training.theme === filters.theme;
    const matchesSearch =
      filters.search === "" ||
      training.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      training.location?.district
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      training.location?.state
        ?.toLowerCase()
        .includes(filters.search.toLowerCase());
    return matchesStatus && matchesTheme && matchesSearch;
  });

  const mappableLocations = useMemo(
    () =>
      filteredTrainings
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
    [filteredTrainings],
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const trainingsWithCoords = useMemo(
    () =>
      filteredTrainings.filter(
        (training) =>
          Number.isFinite(Number(training.location?.latitude)) &&
          Number.isFinite(Number(training.location?.longitude)),
      ),
    [filteredTrainings],
  );

  const districtCoordinateLookup = useMemo(() => {
    const map = new Map();

    globalTrainings.forEach((training) => {
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
  }, [globalTrainings]);

  const heatmapZones = useMemo(() => {
    const zonesByDisaster = disasterRiskData[selectedDisaster] || {};
    const zones = [];

    Object.entries(zonesByDisaster).forEach(([state, riskBandGroups]) => {
      const allDistricts = [
        ...(riskBandGroups.high || []),
        ...(riskBandGroups.moderate || []),
      ];

      allDistricts.forEach((district, index) => {
        const matchingTrainings = globalTrainings.filter((training) => {
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

        // Check verified district coordinates first, then training-based, then fallback
        let center;
        const verifiedCoord = districtCoordsData.entries?.find(
          (entry) =>
            normalizeText(entry.district) === normalizeText(district) &&
            normalizeText(entry.state) === normalizeText(state),
        );

        if (verifiedCoord) {
          center = [verifiedCoord.latitude, verifiedCoord.longitude];
        } else {
          // Fall back to training-based averages
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
  }, [districtCoordinateLookup, globalTrainings, selectedDisaster]);

  const heatmapRecommendationText = (zone) => {
    if (zone.riskLevel === "HIGH") {
      return `Conduct ${selectedDisaster} training within 2 weeks.`;
    }
    if (zone.riskLevel === "MEDIUM") {
      return `Plan ${selectedDisaster} training within 1 month.`;
    }
    return `Maintain periodic ${selectedDisaster} drills every quarter.`;
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
            isDisasterType
              ? styles["popup-disaster-keyword"]
              : styles["popup-keyword"]
          }
        >
          {part}
        </span>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      );
    });
  };

  const visibleHeatmapZones = useMemo(() => {
    if (!isolatedZoneKey) {
      return heatmapZones;
    }

    const isolatedZone = heatmapZones.find(
      (zone) => zone.key === isolatedZoneKey,
    );
    return isolatedZone ? [isolatedZone] : heatmapZones;
  }, [heatmapZones, isolatedZoneKey]);

  const getZoneKeyFromRecommendation = (item) =>
    `${item.disaster}::${item.state}::${item.district}`;

  const handleRecommendationClick = (item) => {
    const zoneKey = getZoneKeyFromRecommendation(item);
    setShowHeatmap(true);
    setShowTrainings(false);
    setSelectedDisaster(item.disaster);
    setIsolatedZoneKey(zoneKey);
    setFocusedRecommendationKey(zoneKey);
  };

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

  return (
    <div className="layout-container">
      <Sidebar role="partner" />
      <div className="main-content">
        <div className="top-nav">
          <h2 className="nav-title">
            Partner Dashboard - {user?.organizationName}
          </h2>
          <div className="nav-right">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.contactPerson?.[0]?.toUpperCase()}
              </div>
              <span>{user?.contactPerson}</span>
            </div>
          </div>
        </div>

        <div className="page-content">
          {/* Stats Cards */}
          <div className={styles["dashboard-stats"]}>
            <div className={styles["stat-card-new"]}>
              <div
                className={styles["stat-icon-new"]}
                style={{ backgroundColor: "#dbeafe" }}
              >
                <FiBarChart2 size={24} color="#1e40af" />
              </div>
              <div className={styles["stat-content-new"]}>
                <div className={styles["stat-number-new"]}>{stats.total}</div>
                <div className={styles["stat-label-new"]}>Total Trainings</div>
              </div>
            </div>
            <div className={styles["stat-card-new"]}>
              <div
                className={styles["stat-icon-new"]}
                style={{ backgroundColor: "#dcfce7" }}
              >
                <FiCheck size={24} color="#15803d" />
              </div>
              <div className={styles["stat-content-new"]}>
                <div className={styles["stat-number-new"]}>
                  {stats.approved}
                </div>
                <div className={styles["stat-label-new"]}>Approved</div>
              </div>
            </div>
            <div className={styles["stat-card-new"]}>
              <div
                className={styles["stat-icon-new"]}
                style={{ backgroundColor: "#fef3c7" }}
              >
                <FiClock size={24} color="#a16207" />
              </div>
              <div className={styles["stat-content-new"]}>
                <div className={styles["stat-number-new"]}>{stats.pending}</div>
                <div className={styles["stat-label-new"]}>Pending</div>
              </div>
            </div>
            <div className={styles["stat-card-new"]}>
              <div
                className={styles["stat-icon-new"]}
                style={{ backgroundColor: "#fee2e2" }}
              >
                <FiBarChart2 size={24} color="#991b1b" />
              </div>
              <div className={styles["stat-content-new"]}>
                <div className={styles["stat-number-new"]}>
                  {allTrainings.filter((t) => t.status === "rejected").length}
                </div>
                <div className={styles["stat-label-new"]}>Rejected</div>
              </div>
            </div>
          </div>

          <div className={styles["map-recommendation-layout"]}>
            {/* Map Section with Filters */}
            <div className={`card ${styles["map-panel"]}`}>
              <div className={styles["map-header"]}>
                <div className={styles["map-title"]}>
                  <FiMap size={20} style={{ marginRight: "8px" }} />
                  <h3>Training Locations Map</h3>
                </div>
                <div className={styles["map-header-actions"]}>
                  <button
                    type="button"
                    className={styles["filter-toggle-button"]}
                    onClick={() => setShowFilterDrawer((prev) => !prev)}
                    aria-expanded={showFilterDrawer}
                    aria-label="Toggle filters"
                  >
                    <FiFilter />
                  </button>
                </div>
              </div>

              {/* Map */}
              <div className={styles["map-stage"]}>
                <div className={styles["map-container"]}>
                  {loading ? (
                    <div className={styles["map-loading"]}>
                      <div className="spinner"></div>
                      <p>Loading map...</p>
                    </div>
                  ) : !showHeatmap && !showTrainings ? (
                    <div className={styles["map-empty"]}>
                      <FiMap size={48} />
                      <p>Enable Risk Heatmap or Trainings to view map layers</p>
                    </div>
                  ) : !showHeatmap && trainingsWithCoords.length === 0 ? (
                    <div className={styles["map-empty"]}>
                      <FiMap size={48} />
                      <p>No trainings with location data</p>
                    </div>
                  ) : (
                    <MapContainer
                      center={[20.5937, 78.9629]}
                      zoom={5}
                      whenCreated={(mapInstance) => {
                        mapRef.current = mapInstance;
                      }}
                      style={{
                        height: "500px",
                        width: "100%",
                        borderRadius: "8px",
                      }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                            radius={20000 + zone.riskScore * 350}
                            pathOptions={{
                              color: getHeatColor(zone.riskLevel),
                              fillColor: getHeatColor(zone.riskLevel),
                              fillOpacity: 0.26,
                              weight: 2,
                            }}
                          >
                            <Popup>
                              <div className={styles["heatmap-popup"]}>
                                <h4>
                                  {zone.district}, {zone.state}
                                </h4>
                                <p>
                                  <strong>Risk Level:</strong> {zone.riskLevel}{" "}
                                  (Score: {zone.riskScore})
                                </p>
                                <p>
                                  <strong>Reason:</strong>
                                </p>
                                <ul>
                                  {zone.reasons.map((reason) => (
                                    <li key={reason}>
                                      {highlightPopupKeywords(reason)}
                                    </li>
                                  ))}
                                </ul>
                                <p>
                                  <strong>Recommendation:</strong>{" "}
                                  {highlightPopupKeywords(
                                    heatmapRecommendationText(zone),
                                  )}
                                </p>
                                <button
                                  type="button"
                                  className={styles["schedule-btn"]}
                                  onClick={() =>
                                    navigate("/partner/add-training")
                                  }
                                >
                                  Schedule Training
                                </button>
                              </div>
                            </Popup>
                          </Circle>
                        ))}

                      {showTrainings &&
                        trainingsWithCoords.map((training) => {
                          const recommendation =
                            getTrainingRecommendation(training);
                          const priority = recommendation?.priority || "Low";

                          return (
                            <CircleMarker
                              key={training._id}
                              center={[
                                Number(training.location.latitude),
                                Number(training.location.longitude),
                              ]}
                              radius={8}
                              pathOptions={{
                                fillColor: getColor(priority),
                                color: "#fff",
                                weight: 2,
                                opacity: 1,
                                fillOpacity: 0.95,
                              }}
                            >
                              <Popup>
                                <div style={{ minWidth: "200px" }}>
                                  <h4
                                    style={{
                                      marginBottom: "8px",
                                      fontSize: "14px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {training.title}
                                  </h4>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    <strong>Theme:</strong> {training.theme}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    <strong>Location:</strong>{" "}
                                    {training.location?.city},{" "}
                                    {training.location?.district},{" "}
                                    {training.location?.state}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    <strong>Date:</strong>{" "}
                                    {new Date(
                                      training.startDate,
                                    ).toLocaleDateString()}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    <strong>Participants:</strong>{" "}
                                    {training.participantsCount}
                                  </div>
                                </div>
                              </Popup>
                            </CircleMarker>
                          );
                        })}
                    </MapContainer>
                  )}
                  {mappableLocations.length === 0 && (
                    <div className={styles.noDataOverlay}>
                      <p>No training locations with coordinates available</p>
                    </div>
                  )}
                </div>
              </div>

              {showFilterDrawer && (
                <button
                  type="button"
                  className={styles["filter-backdrop"]}
                  aria-label="Close filters"
                  onClick={() => setShowFilterDrawer(false)}
                />
              )}

              <aside
                className={`${styles["filter-drawer"]} ${showFilterDrawer ? styles["filter-drawer-open"] : ""}`}
                aria-hidden={!showFilterDrawer}
              >
                <div className={styles["filter-drawer-header"]}>
                  <h4>Filters</h4>
                  <button
                    type="button"
                    className={styles["filter-drawer-close-button"]}
                    onClick={() => setShowFilterDrawer(false)}
                    aria-label="Close filters"
                  >
                    x
                  </button>
                </div>

                <div className={styles["filter-drawer-body"]}>
                  <div className={styles["filter-drawer-field"]}>
                    <label>Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                      className={styles["filter-select"]}
                    >
                      <option value="all">All Status</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className={styles["filter-drawer-field"]}>
                    <label>Theme</label>
                    <select
                      value={filters.theme}
                      onChange={(e) =>
                        handleFilterChange("theme", e.target.value)
                      }
                      className={styles["filter-select"]}
                    >
                      <option value="all">All Themes</option>
                      {themes.map((theme) => (
                        <option key={theme} value={theme}>
                          {theme}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles["filter-drawer-field"]}>
                    <label>Search</label>
                    <input
                      type="text"
                      placeholder="Search by title or location..."
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                      className={styles["filter-search"]}
                    />
                  </div>

                  <div className={styles["filter-drawer-field"]}>
                    <label className={styles["filter-drawer-checkbox"]}>
                      <input
                        type="checkbox"
                        checked={showTrainings}
                        onChange={(e) => setShowTrainings(e.target.checked)}
                      />
                      Show Trainings
                    </label>
                  </div>

                  <div className={styles["filter-drawer-count"]}>
                    Showing {filteredTrainings.length} of {allTrainings.length}{" "}
                    trainings
                  </div>
                </div>
              </aside>
            </div>

            <div
              className={`${styles["recommendation-section"]} ${styles["recommendation-panel"]}`}
            >
              <div className={styles["recommendation-header"]}>
                <h3>Training Recommendations</h3>
                <button
                  type="button"
                  className={styles["recommendation-filter-toggle-button"]}
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
                  className={styles["recommendation-filter-backdrop"]}
                  aria-label="Close recommendation filters"
                  onClick={() => setShowRecommendationFilterDrawer(false)}
                />
              )}

              <aside
                className={`${styles["recommendation-filter-drawer"]} ${showRecommendationFilterDrawer ? styles["recommendation-filter-drawer-open"] : ""}`}
                aria-hidden={!showRecommendationFilterDrawer}
              >
                <div className={styles["recommendation-filter-drawer-header"]}>
                  <h4>Recommendation Filters</h4>
                  <button
                    type="button"
                    className={
                      styles["recommendation-filter-drawer-close-button"]
                    }
                    onClick={() => setShowRecommendationFilterDrawer(false)}
                    aria-label="Close recommendation filters"
                  >
                    x
                  </button>
                </div>

                <div className={styles["recommendation-filter-drawer-body"]}>
                  <div className={styles["recommendation-filter-drawer-field"]}>
                    <label htmlFor="recommendation-state-filter">State</label>
                    <select
                      id="recommendation-state-filter"
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

                  <div className={styles["recommendation-filter-drawer-field"]}>
                    <label>Disaster Type</label>
                    <select
                      value={selectedDisaster}
                      onChange={(e) => setSelectedDisaster(e.target.value)}
                    >
                      {DISASTER_OPTIONS.map((disaster) => (
                        <option key={disaster} value={disaster}>
                          {disaster}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles["recommendation-filter-drawer-field"]}>
                    <label
                      className={
                        styles["recommendation-filter-drawer-checkbox"]
                      }
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

              <div className={styles["recommendation-grid"]}>
                {topRecommendations.length > 0 ? (
                  topRecommendations.map((item) => (
                    <div
                      key={item.key}
                      className={`${styles["recommendation-card"]} ${styles["recommendation-card-clickable"]}`}
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
                      <div className={styles["recommendation-card-header"]}>
                        <div>
                          <p className={styles["recommendation-location"]}>
                            {item.district}, {item.state}
                          </p>
                          <h4>{item.recommendation}</h4>
                        </div>
                        <span
                          className={`${styles["priority-badge"]} ${styles[`priority${item.priority}`]}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className={styles["recommendation-meta"]}>
                        <strong>{item.disaster}</strong> risk • score{" "}
                        {item.score.toFixed(1)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className={styles["recommendation-empty"]}>
                    No priority recommendations available yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="card">
            <h3 className="card-header">Recent Submissions</h3>
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : trainings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>No trainings submitted yet</p>
              </div>
            ) : (
              <div className={styles["dashboard-table"]}>
                <table>
                  <thead>
                    <tr>
                      <th>Training Title</th>
                      <th>Theme</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Participants</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainings.map((training) => (
                      <tr key={training._id}>
                        <td>{training.title}</td>
                        <td>{training.theme}</td>
                        <td>
                          {new Date(training.startDate).toLocaleDateString()}
                        </td>
                        <td>
                          {training.location?.district},{" "}
                          {training.location?.state}
                        </td>
                        <td>{training.participantsCount}</td>
                        <td>
                          <span className={`badge badge-${training.status}`}>
                            {training.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
