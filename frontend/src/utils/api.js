import axios from "axios";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password, role) =>
    api.post("/auth/login", { email, password, role }),
  participantLogin: (email, aadhaarNumber) =>
    api.post("/auth/participant-login", { email, aadhaarNumber }),
  participantRegister: (data) => api.post("/auth/participant-register", data),
  register: (data) => api.post("/auth/register", data),
  refreshToken: () => api.post("/auth/refresh"),
};

export const participantAPI = {
  getProfile: () => api.get("/auth/participant/profile"),
  updateProfile: (data) => api.put("/auth/participant/profile", data),
  getRecords: () => api.get("/auth/participant/records"),
  getDashboard: () => api.get("/auth/participant/dashboard"),
  getNotifications: () => api.get("/auth/participant/notifications"),
  markNotificationAsRead: (id) => api.patch(`/auth/participant/notifications/${id}/read`),
};

export const trainingAPI = {
  getAll: (filters = {}) => api.get("/trainings", { params: filters }),
  getById: (id) => api.get(`/trainings/${id}`),
  getByPartnerId: (partnerId) =>
    api.get("/trainings", { params: { partnerId } }),
  create: (data) => api.post("/trainings", data),
  createScheduled: (data) => api.post("/trainings/schedule", data),
  submitScheduledForApproval: (id, data) =>
    api.patch(`/trainings/${id}/submit-for-approval`, data),
  cancelScheduled: (id) => api.patch(`/trainings/${id}/cancel-scheduled`),
  update: (id, data) => api.put(`/trainings/${id}`, data),
  delete: (id) => api.delete(`/trainings/${id}`),
  updateStatus: (id, status, reason = "") =>
    api.patch(`/trainings/${id}/status`, { status, reason }),
  register: (id) => api.post(`/trainings/${id}/register`),
  cancelRegistration: (id) => api.post(`/trainings/${id}/cancel-registration`),
};

export const partnerAPI = {
  getAll: (filters = {}) => api.get("/partners", { params: filters }),
  getById: (id) => api.get(`/partners/${id}`),
  create: (data) => api.post("/partners", data),
  update: (id, data) => api.put(`/partners/${id}`, data),
  approve: (id) => api.patch(`/partners/${id}/approve`),
  reject: (id, reason) => api.patch(`/partners/${id}/reject`, { reason }),
  updateStatus: (id, status) => api.patch(`/partners/${id}/status`, { status }),
};

export const uploadAPI = {
  uploadSingle: (file, folder = "training-management") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    return api.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadMultiple: (files, folder = "training-management") => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("folder", folder);
    return api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: (publicId, resourceType = "image") => {
    return api.delete("/upload/delete", {
      data: { publicId, resourceType },
    });
  },

  deleteMultiple: (publicIds, resourceType = "image") => {
    return api.delete("/upload/delete-multiple", {
      data: { publicIds, resourceType },
    });
  },
};

export const analyticsAPI = {
  getDashboard: () => api.get("/analytics/dashboard"),
  getCoverageReport: () => api.get("/analytics/coverage"),
  getGapAnalysis: () => api.get("/analytics/gaps"),
  getTrainingLocations: () => api.get("/analytics/training-locations"),
};

export const certificateAPI = {
  verifyByAadhaar: (aadhaarNumber) =>
    api.get(`/certificates/verify/${aadhaarNumber}`),
};

export default api;
