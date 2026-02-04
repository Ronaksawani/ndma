import axios from "axios";

const API_BASE = "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE,
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
  register: (data) => api.post("/auth/register", data),
  refreshToken: () => api.post("/auth/refresh"),
};

export const trainingAPI = {
  getAll: (filters = {}) => api.get("/trainings", { params: filters }),
  getById: (id) => api.get(`/trainings/${id}`),
  getByPartnerId: (partnerId) => api.get("/trainings", { params: { partnerId } }),
  create: (data) => api.post("/trainings", data),
  update: (id, data) => api.put(`/trainings/${id}`, data),
  delete: (id) => api.delete(`/trainings/${id}`),
  updateStatus: (id, status, reason = "") =>
    api.patch(`/trainings/${id}/status`, { status, reason }),
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
