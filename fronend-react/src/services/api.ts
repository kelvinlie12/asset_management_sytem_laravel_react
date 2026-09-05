import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (
      body &&
      typeof body === "object" &&
      body.success === true &&
      "data" in body
    ) {
      response.data = body.data;
    }
    return response;
  },
  (error) => {
    const url = error.config?.url ?? "";
    if (error.response?.status === 401 && !url.includes("/auth/login")) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.assign("/signin");
    }
    return Promise.reject(error);
  },
);

export default api;
