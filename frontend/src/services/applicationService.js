import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_URL = `${API_BASE_URL}/applications`;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getApplications = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) params.append("status", filters.status);
  if (filters.priority) params.append("priority", filters.priority);
  if (filters.search) params.append("search", filters.search);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.order) params.append("order", filters.order);

  const queryString = params.toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;

  const response = await axios.get(url, getAuthConfig());
  return response.data;
};

export const getApplicationStats = async () => {
  const response = await axios.get(`${API_URL}/stats`, getAuthConfig());
  return response.data;
};

export const createApplication = async (formData) => {
  const response = await axios.post(API_URL, formData, getAuthConfig());
  return response.data;
};

export const updateApplication = async (id, formData) => {
  const response = await axios.put(
    `${API_URL}/${id}`,
    formData,
    getAuthConfig(),
  );
  return response.data;
};

export const deleteApplication = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};


export const exportApplications = async (format) => {
  const response = await axios.get(`${API_URL}/export/${format}`, {
    ...getAuthConfig(),
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `hiretrack-applications.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const emailApplication = async (id, payload) => {
  const response = await axios.post(`${API_URL}/${id}/email`, payload, getAuthConfig());
  return response.data;
};
