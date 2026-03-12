import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../context/AuthContext";
import type { User } from "../context/AuthContext";
import api from "../services/axios";
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });
  const [loading, setLoading] = useState(true);

  // Fetch fresh user on app load
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch user", error);
        setUser(null);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  //  Auto sync user → localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  //const [loading] = useState(false);
  const login = (user: User, accessToken: string) => {
    setUser(user);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout"); // call backend
    } catch (error) {
      console.error(error);
    }

    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
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
