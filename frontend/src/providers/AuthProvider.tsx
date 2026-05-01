import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../context/AuthContext";
import type { User } from "../context/AuthContext";
import api, { setApiToken } from "../services/axios";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.post("/auth/refresh-token");
        const newToken = res.data.accessToken;

        setApiToken(newToken);

        const { data } = await api.get("/auth/me");
        setUser(data);
} catch (err: unknown) {
  const error = err as { response?: { status?: number; data?: unknown }; message?: string };
  console.error("Session restore failed:", error.response?.status, error.response?.data, error.message);
  setUser(null);
  setApiToken(null);
} finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData: User, accessToken: string) => {
    setApiToken(accessToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(error);
    }

    setApiToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
