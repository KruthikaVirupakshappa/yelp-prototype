import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    config.headers = config.headers || {};

    if (token) {
      
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    
    console.log("[API REQUEST]", (config.method || "").toUpperCase(), config.url, {
      auth: config.headers.Authorization ? "set" : "missing",
    });

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    
    console.log("[API ERROR]", err?.response?.status, err?.config?.url, err?.response?.data);

    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);