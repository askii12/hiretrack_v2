import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_URL = `${API_BASE_URL}/activity`;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getActivityLogs = async () => {
  const response = await axios.get(API_URL, getAuthConfig());
  return response.data;
};
