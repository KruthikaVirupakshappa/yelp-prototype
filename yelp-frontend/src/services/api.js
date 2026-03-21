import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
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

    console.log(
      "[API REQUEST]",
      (config.method || "").toUpperCase(),
      config.url,
      { auth: token ? "set" : "missing" }
    );

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(
      "[API ERROR]",
      error?.response?.status,
      error?.config?.url,
      error?.response?.data
    );

    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);