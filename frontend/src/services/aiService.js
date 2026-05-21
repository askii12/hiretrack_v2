import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_URL = `${API_BASE_URL}/ai`;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const generateJobDescription = async (payload) => {
  const response = await axios.post(`${API_URL}/job-description`, payload, getAuthConfig());
  return response.data;
};

export const matchResume = async (payload) => {
  const response = await axios.post(`${API_URL}/resume-match`, payload, getAuthConfig());
  return response.data;
};
