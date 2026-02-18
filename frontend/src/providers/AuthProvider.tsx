import { useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../context/AuthContext";
import type { User } from "../context/AuthContext";
import api from "../services/axios";
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });

  const [loading] = useState(false);
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
