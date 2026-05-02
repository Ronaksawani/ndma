import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "../components/Sidebar";
import { trainingAPI } from "../utils/api";
import themeOptions from "../data/themes.json";
import statesDistrictsData from "../data/statesDistricts.json";
import styles from "../styles/Form.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const stateDistrictMap = statesDistrictsData.districts;
const stateList = statesDistrictsData.states;

function LocationPicker({ onLocationSelect, initialLat, initialLng }) {
  const [position, setPosition] = useState([
    initialLat || 20.5937,
    initialLng || 78.9629,
  ]);

  function LocationMarker() {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
      },
    });

    return position ? (
      <Marker position={position}>
        <Popup>
          Location: {position[0].toFixed(4)}, {position[1].toFixed(4)}
        </Popup>
      </Marker>
    ) : null;
  }

  return (
    <MapContainer
      center={position}
      zoom={5}
      style={{ height: "300px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker />
    </MapContainer>
  );
}

export default function ScheduleTraining() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    theme: "",
    startDate: "",
    endDate: "",
    state: "",
    district: "",
    city: "",
    addressLine: "",
    pincode: "",
    latitude: "",
    longitude: "",
    trainerName: "",
    trainerEmail: "",
    trainerContactNo: "",
    participantsCount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "state") {
      setFormData((prev) => ({ ...prev, [name]: value, district: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        address: formData.addressLine,
        participantsCount: parseInt(formData.participantsCount, 10) || 0,
      };

      await trainingAPI.createScheduled(payload);
      alert("Training scheduled successfully!");
      navigate("/partner/my-trainings");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to schedule training",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container">
      <Sidebar role="partner" />
      <div className="main-content">
        <div className="top-nav">
          <h2 className="nav-title">Schedule Training</h2>
        </div>

        <div className="page-content">
          <div className={styles["form-container"]}>
            <div className={styles["form-card"]}>
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className={styles["form-section"]}>
                  <h3 className={styles["form-section-title"]}>
                    Schedule New Training Event
                  </h3>

                  <div className={styles["form-row"]}>
                    <div className={styles["form-group"]}>
                      <label>Training Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Flood Rescue Training"
                        required
                      />
                    </div>
                    <div className={styles["form-group"]}>
                      <label>Theme</label>
                      <select
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Theme</option>
                        {themeOptions.map((theme) => (
                          <option key={theme.value} value={theme.value}>
                            {theme.emoji
                              ? `${theme.emoji} ${theme.label}`
                              : theme.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles["form-row"]}>
                    <div className={styles["form-group"]}>
                      <label>Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className={styles["form-group"]}>
                      <label>End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles["form-section"]}>
                  <h3 className={styles["form-section-title"]}>
                    Location Details
                  </h3>

                  <div
                    className={styles["form-row"] + " " + styles["three-col"]}
                  >
                    <div className={styles["form-group"]}>
                      <label>State</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select State</option>
                        {stateList.map((state) => (
                          <option key={state.value} value={state.value}>
                            {state.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles["form-group"]}>
                      <label>District</label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        required
                        disabled={!formData.state}
                      >
                        <option value="">
                          {formData.state
                            ? "Select District"
                            : "Select State First"}
                        </option>
                        {formData.state &&
                          stateDistrictMap[formData.state]?.map((district) => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className={styles["form-group"]}>
                      <label>City/Village</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City or Village"
                      />
                    </div>
                  </div>

                  <div
                    className={styles["form-row"] + " " + styles["three-col"]}
                  >
                    <div className={styles["form-group"]}>
                      <label>Address Line</label>
                      <input
                        type="text"
                        name="addressLine"
                        value={formData.addressLine}
                        onChange={handleChange}
                        placeholder="House / street / landmark"
                      />
                    </div>
                    <div className={styles["form-group"]}>
                      <label>Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="e.g., 400001"
                        maxLength="6"
                      />
                    </div>
                    <div className={styles["form-group"]}>
                      <label>Latitude</label>
                      <input
                        type="number"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                        placeholder="Click on map or enter manually"
                        step="0.0001"
                      />
                    </div>
                    <div className={styles["form-group"]}>
                      <label>Longitude</label>
                      <input
                        type="number"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                        placeholder="Click on map or enter manually"
                        step="0.0001"
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <label
                      style={{
                        marginBottom: "10px",
                        display: "block",
                        fontWeight: "600",
                      }}
                    >
                      Select Location on Map
                    </label>
                    <div
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <LocationPicker
                        onLocationSelect={(lat, lng) => {
                          setFormData((prev) => ({
                            ...prev,
                            latitude: lat,
                            longitude: lng,
                          }));
                        }}
                        initialLat={formData.latitude}
                        initialLng={formData.longitude}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles["form-section"]}>
                  <h3 className={styles["form-section-title"]}>
                    Trainer Details
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "20px",
                      marginBottom: "20px",
                    }}
                  >
                    <div className={styles["form-group"]}>
                      <label>Trainer Name</label>
                      <input
                        type="text"
                        name="trainerName"
                        value={formData.trainerName}
                        onChange={handleChange}
                        placeholder="Full name"
                      />
                    </div>
                    <div className={styles["form-group"]}>
                      <label>Trainer Email</label>
                      <input
                        type="email"
                        name="trainerEmail"
                        value={formData.trainerEmail}
                        onChange={handleChange}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className={styles["form-group"]}>
                      <label>Contact No.</label>
                      <input
                        type="tel"
                        name="trainerContactNo"
                        value={formData.trainerContactNo}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        inputMode="numeric"
                        maxLength="10"
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 0.7fr",
                      gap: "20px",
                      marginBottom: "20px",
                    }}
                  >
                    <div className={styles["form-group"]}>
                      <label>Max Participants Count</label>
                      <input
                        type="number"
                        name="participantsCount"
                        value={formData.participantsCount}
                        onChange={handleChange}
                        placeholder="Max participants"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles["form-actions"]}>
                  <button
                    type="button"
                    className={
                      styles["form-btn"] + " " + styles["form-btn-cancel"]
                    }
                    onClick={() => navigate("/partner/dashboard")}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={
                      styles["form-btn"] + " " + styles["form-btn-submit"]
                    }
                    disabled={loading}
                  >
                    {loading ? "Scheduling..." : "Schedule Training"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
