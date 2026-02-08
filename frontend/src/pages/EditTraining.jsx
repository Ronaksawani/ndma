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
import { trainingAPI, uploadAPI } from "../utils/api";
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
  const [deletedPhotos, setDeletedPhotos] = useState([]); // Track deleted photos for Cloudinary cleanup
  const [deletedCsvFile, setDeletedCsvFile] = useState(null); // Track deleted CSV for Cloudinary cleanup
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [error, setError] = useState("");
  const [currentParticipant, setCurrentParticipant] = useState({
    fullName: "",
    aadhaarNumber: "",
    email: "",
    phone: "",
  });
  const [addedParticipants, setAddedParticipants] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const isAadhaarValid = (value) => /^\d{12}$/.test(value);
  const isEmailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isPhoneValid = (value) => /^\d{10}$/.test(value);
  const isParticipantComplete = (participant) =>
    participant.fullName.trim().length > 0 &&
    isEmailValid(participant.email.trim()) &&
    isPhoneValid(participant.phone.trim()) &&
    isAadhaarValid(participant.aadhaarNumber.trim());

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

      // Load existing participants
      if (training.participants && training.participants.length > 0) {
        setAddedParticipants(training.participants);
      }

      // Load existing photos
      if (training.photos && training.photos.length > 0) {
        // Convert existing photos to File-like objects for display
        const existingPhotos = training.photos.map((photo, index) => ({
          name: photo.filename || `Photo ${index + 1}`,
          url: photo.url,
          isExisting: true,
        }));
        setPhotos(existingPhotos);
      }

      // Load existing attendance sheet
      if (training.attendanceSheet && training.attendanceSheet.filename) {
        // Create a File-like object for the CSV
        const csvFileObj = {
          name: training.attendanceSheet.filename,
          url: training.attendanceSheet.url,
          isExisting: true,
        };
        setCsvFile(csvFileObj);
      }

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
    const photoToRemove = photos[index];
    // Track existing photos for Cloudinary deletion
    if (photoToRemove.isExisting && photoToRemove.url) {
      // Extract publicId from Cloudinary URL
      const urlParts = photoToRemove.url.split("/");
      const publicIdWithExt = urlParts.slice(-2).join("/"); // folder/filename.ext
      const publicId = publicIdWithExt.split(".")[0]; // Remove extension
      setDeletedPhotos((prev) => [
        ...prev,
        { publicId, url: photoToRemove.url },
      ]);
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const removeCSVFile = () => {
    // Track existing CSV for Cloudinary deletion
    if (csvFile && csvFile.isExisting && csvFile.url) {
      const urlParts = csvFile.url.split("/");
      const publicIdWithExt = urlParts.slice(-2).join("/"); // folder/filename.ext
      const publicId = publicIdWithExt.split(".")[0]; // Remove extension
      setDeletedCsvFile({ publicId, url: csvFile.url });
    }
    setCsvFile(null);
  };

  const handleParticipantChange = (field, value) => {
    let nextValue = value;
    if (field === "aadhaarNumber") {
      nextValue = value.replace(/\D/g, "").slice(0, 12);
    } else if (field === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setCurrentParticipant((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const addParticipant = () => {
    if (!isParticipantComplete(currentParticipant)) {
      setError(
        "Please fill all fields: valid name, 12-digit Aadhaar, valid email, and 10-digit phone.",
      );
      return;
    }
    setError("");
    if (editingIndex !== null) {
      // Update existing participant
      const updated = [...addedParticipants];
      updated[editingIndex] = currentParticipant;
      setAddedParticipants(updated);
      setEditingIndex(null);
    } else {
      // Add new participant
      setAddedParticipants((prev) => [...prev, currentParticipant]);
    }
    setCurrentParticipant({
      fullName: "",
      aadhaarNumber: "",
      email: "",
      phone: "",
    });
  };

  const editParticipant = (index) => {
    setCurrentParticipant(addedParticipants[index]);
    setEditingIndex(index);
  };

  const deleteParticipant = (index) => {
    setAddedParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setCurrentParticipant({
      fullName: "",
      aadhaarNumber: "",
      email: "",
      phone: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    setSubmitting(true);

    try {
      // Delete removed files from Cloudinary first
      const filesToDelete = [];

      // Add deleted photos
      if (deletedPhotos.length > 0) {
        filesToDelete.push(...deletedPhotos.map((p) => p.publicId));
      }

      // Add deleted CSV
      if (deletedCsvFile) {
        filesToDelete.push(deletedCsvFile.publicId);
      }

      // Delete files from Cloudinary
      if (filesToDelete.length > 0) {
        try {
          await uploadAPI.deleteMultiple(filesToDelete, "auto");
          console.log(
            `Deleted ${filesToDelete.length} file(s) from Cloudinary`,
          );
        } catch (deleteError) {
          console.error("Error deleting files from Cloudinary:", deleteError);
          // Continue with update even if deletion fails
        }
      }

      // Separate existing and new photos
      const existingPhotos = photos.filter((photo) => photo.isExisting);
      const newPhotos = photos.filter((photo) => !photo.isExisting);

      // Upload new photos if any
      let newPhotoUrls = [];
      if (newPhotos.length > 0) {
        setUploadingFiles(true);
        const uploadResponse = await uploadAPI.uploadMultiple(
          newPhotos,
          "training-photos",
        );
        setUploadingFiles(false);

        if (!uploadResponse.data.success) {
          throw new Error(uploadResponse.data.error || "Photo upload failed");
        }

        newPhotoUrls = uploadResponse.data.data.map((file) => ({
          url: file.url,
          publicId: file.publicId,
          filename: file.filename,
        }));
      }

      // Combine existing and new photos
      const allPhotos = [
        ...existingPhotos.map((photo) => ({
          url: photo.url,
          filename: photo.name,
        })),
        ...newPhotoUrls,
      ];

      // Handle CSV file
      let attendanceSheetData = null;
      if (csvFile) {
        if (csvFile.isExisting) {
          // Keep existing CSV file
          attendanceSheetData = {
            url: csvFile.url,
            filename: csvFile.name,
          };
        } else {
          // Upload new CSV file
          setUploadingFiles(true);
          const csvUploadResponse = await uploadAPI.uploadSingle(
            csvFile,
            "training-attendance",
          );
          setUploadingFiles(false);

          if (!csvUploadResponse.data.success) {
            throw new Error(
              csvUploadResponse.data.error || "CSV upload failed",
            );
          }

          attendanceSheetData = {
            url: csvUploadResponse.data.data.url,
            publicId: csvUploadResponse.data.data.publicId,
            filename: csvUploadResponse.data.data.filename,
          };
        }
      }

      const cleanedParticipants = addedParticipants.map((participant) => ({
        fullName: participant.fullName.trim(),
        aadhaarNumber: participant.aadhaarNumber.trim(),
        email: participant.email.trim(),
        phone: participant.phone.trim(),
      }));

      const payload = {
        ...formData,
        participants: cleanedParticipants,
        photos: allPhotos,
        attendanceSheet: attendanceSheetData,
      };

      await trainingAPI.update(id, payload);
      alert("Training event updated successfully!");
      navigate("/partner/my-trainings");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update training event",
      );
    } finally {
      setSubmitting(false);
      setUploadingFiles(false);
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
                        <option value="Flood Management">Flood Rescue</option>
                        <option value="Earthquake Safety">
                          Earthquake Preparedness
                        </option>
                        <option value="Cyclone Management">
                          Cyclone Management
                        </option>
                        <option value="First Aid">First Aid</option>
                        <option value="Fire Safety">Fire Safety</option>
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
                        <div className={styles["upload-area-content"]}>
                          <div className={styles["upload-area-title"]}>
                            Event Photos/Videos
                          </div>
                          <div className={styles["upload-area-subtitle"]}>
                            Drag and drop or click to upload
                          </div>
                        </div>
                        <div className={styles["upload-area-icon"]}>
                          <CiCamera size={40} />
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
                                {photo.isExisting && (
                                  <small
                                    style={{
                                      color: "#10b981",
                                      marginLeft: "8px",
                                    }}
                                  >
                                    (Existing)
                                  </small>
                                )}
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
                        <div className={styles["upload-area-content"]}>
                          <div className={styles["upload-area-title"]}>
                            Participant List (CSV/Excel)
                          </div>
                          <div className={styles["upload-area-subtitle"]}>
                            Drag and drop or click to upload
                          </div>
                        </div>
                        <div className={styles["upload-area-icon"]}>
                          <CiFileOn size={40} />
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
                          className={styles["uploaded-files"]}
                          style={{ marginTop: "15px" }}
                        >
                          <div className={styles["file-item"]}>
                            <span className={styles["file-item-name"]}>
                              {csvFile.name}
                              {csvFile.isExisting && (
                                <small
                                  style={{
                                    color: "#10b981",
                                    marginLeft: "8px",
                                  }}
                                >
                                  (Existing)
                                </small>
                              )}
                            </span>
                            <button
                              type="button"
                              className={styles["file-item-remove"]}
                              onClick={removeCSVFile}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trainee/Participant Details */}
                <div className={styles["form-section"]}>
                  <h3 className={styles["form-section-title"]}>
                    Trainee/Participant Details
                  </h3>
                  <p className={styles["section-subtitle"]}>
                    Add participant details one by one and view them in the
                    table below.
                  </p>

                  {/* Participant Input Form */}
                  <div className={styles["participant-card"]}>
                    <div className={styles["participant-grid"]}>
                      <div className={styles["form-group"]}>
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={currentParticipant.fullName}
                          onChange={(e) =>
                            handleParticipantChange("fullName", e.target.value)
                          }
                          placeholder="Full name"
                        />
                      </div>
                      <div className={styles["form-group"]}>
                        <label>Aadhaar ID</label>
                        <input
                          type="text"
                          value={currentParticipant.aadhaarNumber}
                          onChange={(e) =>
                            handleParticipantChange(
                              "aadhaarNumber",
                              e.target.value,
                            )
                          }
                          placeholder="12-digit Aadhaar"
                          inputMode="numeric"
                          maxLength="12"
                        />
                      </div>
                      <div className={styles["form-group"]}>
                        <label>Email</label>
                        <input
                          type="email"
                          value={currentParticipant.email}
                          onChange={(e) =>
                            handleParticipantChange("email", e.target.value)
                          }
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className={styles["form-group"]}>
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={currentParticipant.phone}
                          onChange={(e) =>
                            handleParticipantChange("phone", e.target.value)
                          }
                          placeholder="10-digit number"
                          maxLength="10"
                        />
                      </div>
                    </div>

                    <div className={styles["participant-actions"]}>
                      <button
                        type="button"
                        className={styles["add-participant-btn"]}
                        onClick={addParticipant}
                      >
                        {editingIndex !== null
                          ? "Update Participant"
                          : "Add Participant"}
                      </button>
                      {editingIndex !== null && (
                        <button
                          type="button"
                          className={styles["cancel-edit-btn"]}
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Participants Table */}
                  {addedParticipants.length > 0 && (
                    <div className={styles["participants-table-container"]}>
                      <h4
                        style={{
                          marginBottom: "15px",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        Added Participants ({addedParticipants.length})
                      </h4>
                      <div className={styles["table-wrapper"]}>
                        <table className={styles["participants-table"]}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Full Name</th>
                              <th>Aadhaar ID</th>
                              <th>Email</th>
                              <th>Phone</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {addedParticipants.map((participant, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{participant.fullName}</td>
                                <td>{participant.aadhaarNumber}</td>
                                <td>{participant.email}</td>
                                <td>{participant.phone}</td>
                                <td>
                                  <div className={styles["action-buttons"]}>
                                    <button
                                      type="button"
                                      className={styles["edit-btn"]}
                                      onClick={() => editParticipant(index)}
                                      title="Edit participant"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className={styles["delete-btn"]}
                                      onClick={() => deleteParticipant(index)}
                                      title="Remove participant"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
                    disabled={submitting || uploadingFiles}
                  >
                    {uploadingFiles
                      ? "Uploading files..."
                      : submitting
                        ? "Updating..."
                        : "Update Training"}
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
