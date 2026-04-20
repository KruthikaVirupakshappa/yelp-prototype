import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
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
      const url = error?.config?.url || "";
      const isMutatingRequest = ["post", "put", "patch", "delete"].includes(
        (error?.config?.method || "").toLowerCase()
      );
      // Only force-logout on GET requests (background fetches), not form submissions
      if (!isMutatingRequest) {
        localStorage.removeItem("token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("user");
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/signup") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);