import axios from "axios";

let inMemoryToken: string | null = null;

let refreshPromise: Promise<string> | null = null;

export const setApiToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getApiToken = () => inMemoryToken;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (inMemoryToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
              {},
              { withCredentials: true },
            )
            .then((res) => {
              const newToken: string = res.data.accessToken;
              inMemoryToken = newToken;
              return newToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;

        return api({
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch {
        inMemoryToken = null;
        refreshPromise = null;
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;