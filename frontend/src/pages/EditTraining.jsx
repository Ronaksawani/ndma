import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CiCamera, CiFileOn } from "react-icons/ci";
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
import statesDistrictsData from "../data/statesDistricts.json";
import styles from "../styles/Form.module.css";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Extract data from JSON
const stateDistrictMap = statesDistrictsData.districts;
const stateList = statesDistrictsData.states;

// Location Picker Component
function LocationPicker({ onLocationSelect, initialLat, initialLng }) {
  const [position, setPosition] = useState([
    initialLat || 20.5937,
    initialLng || 78.9629,
  ]);

  function LocationMarker() {
    const map = useMapEvents({
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

export default function EditTraining() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    theme: "",
    startDate: "",
    endDate: "",
    state: "",
    district: "",
    city: "",
    pincode: "",
    latitude: "",
    longitude: "",
    trainerName: "",
    trainerEmail: "",
    participantsCount: "",
  });
  const [photos, setPhotos] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrainingData();
  }, [id]);

  const fetchTrainingData = async () => {
    try {
      const response = await trainingAPI.getById(id);
      const training = response.data;

      setFormData({
        title: training.title || "",
        theme: training.theme || "",
        startDate: training.startDate?.split("T")[0] || "",
        endDate: training.endDate?.split("T")[0] || "",
        state: training.location?.state || "",
        district: training.location?.district || "",
        city: training.location?.city || "",
        pincode: training.location?.pincode || "",
        latitude: training.location?.latitude || "",
        longitude: training.location?.longitude || "",
        trainerName: training.trainerName || "",
        trainerEmail: training.trainerEmail || "",
        participantsCount: training.participantsCount || "",
      });

      setError("");
    } catch (err) {
      setError("Failed to fetch training data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "state") {
      setFormData((prev) => ({ ...prev, [name]: value, district: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = (e) => {
    setPhotos([...photos, ...Array.from(e.target.files)]);
  };

  const handleCSVUpload = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        formPayload.append(key, formData[key]);
      });
      photos.forEach((photo) => {
        formPayload.append(`photos`, photo);
      });
      if (csvFile) formPayload.append("attendanceSheet", csvFile);

      await trainingAPI.update(id, formPayload);
      alert("Training event updated successfully!");
      navigate("/partner/my-trainings");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update training event"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="layout-container">
        <Sidebar role="partner" />
        <div className="main-content">
          <div style={{ padding: "40px", textAlign: "center" }}>
            Loading training details...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container">
      <Sidebar role="partner" />
      <div className="main-content">
        <div className="top-nav">
          <h2 className="nav-title">Edit Training Event</h2>
        </div>

        <div className="page-content">
          <div className={styles["form-container"]}>
            <div className={styles["form-card"]}>
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Event Details */}
                <div className={styles["form-section"]}>
                  <h3 className={styles["form-section-title"]}>
                    Edit Training Event
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
                        <option value="flood">Flood Rescue</option>
                        <option value="earthquake">
                          Earthquake Preparedness
                        </option>
                        <option value="cyclone">Cyclone Management</option>
                        <option value="first-aid">First Aid</option>
                        <option value="fire">Fire Safety</option>
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

                {/* Location Details */}
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
                    <small
                      style={{
                        marginTop: "8px",
                        display: "block",
                        color: "#666",
                      }}
                    >
                      Click on the map to select the exact location of your
                      training event
                    </small>
                  </div>
                </div>

                {/* Resource Person Details */}
                <div className={styles["form-section"]}>
                  <h3 className={styles["form-section-title"]}>
                    Resource Person(s)
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 0.7fr",
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
                      <label>Participants Count</label>
                      <input
                        type="number"
                        name="participantsCount"
                        value={formData.participantsCount}
                        onChange={handleChange}
                        placeholder="Total"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Uploads */}
                <div className={styles["form-section"]}>
                  <h3 className={styles["form-section-title"]}>Uploads</h3>

                  <div className={styles["uploads-section"]}>
                    <div>
                      <label style={{ marginBottom: "15px", display: "block" }}>
                        Event Photos/Videos
                      </label>
                      <div
                        className={styles["upload-area"]}
                        onClick={() =>
                          document.getElementById("photo-input").click()
                        }
                      >
                        <div className={styles["upload-area-icon"]}>
                          <CiCamera size={40} />
                        </div>
                        <div className={styles["upload-area-title"]}>
                          Event Photos/Videos
                        </div>
                        <div className={styles["upload-area-subtitle"]}>
                          Drag and drop or click to upload
                        </div>
                        <input
                          id="photo-input"
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handlePhotoUpload}
                          className={styles["upload-area-input"]}
                        />
                      </div>
                      {photos.length > 0 && (
                        <div className={styles["uploaded-files"]}>
                          {photos.map((photo, idx) => (
                            <div key={idx} className={styles["file-item"]}>
                              <span className={styles["file-item-name"]}>
                                {photo.name}
                              </span>
                              <button
                                type="button"
                                className={styles["file-item-remove"]}
                                onClick={() => removePhoto(idx)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ marginBottom: "15px", display: "block" }}>
                        Participant List (CSV)
                      </label>
                      <div
                        className={styles["upload-area"]}
                        onClick={() =>
                          document.getElementById("csv-input").click()
                        }
                      >
                        <div className={styles["upload-area-icon"]}>
                          <CiFileOn size={40} />
                        </div>
                        <div className={styles["upload-area-title"]}>
                          Participant List (CSV/Excel)
                        </div>
                        <div className={styles["upload-area-subtitle"]}>
                          Drag and drop or click to upload
                        </div>
                        <input
                          id="csv-input"
                          type="file"
                          accept=".csv,.xlsx"
                          onChange={handleCSVUpload}
                          className={styles["upload-area-input"]}
                        />
                      </div>
                      {csvFile && (
                        <div
                          style={{
                            marginTop: "15px",
                            fontSize: "13px",
                            color: "#059669",
                          }}
                        >
                          ✓ {csvFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className={styles["form-actions"]}>
                  <button
                    type="button"
                    className={
                      styles["form-btn"] + " " + styles["form-btn-cancel"]
                    }
                    onClick={() => navigate("/partner/my-trainings")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={
                      styles["form-btn"] + " " + styles["form-btn-submit"]
                    }
                    disabled={submitting}
                  >
                    {submitting ? "Updating..." : "Update Training"}
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
