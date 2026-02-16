import { useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../context/AuthContext";
import type { User } from "../context/AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading] = useState(false);


  const login = (user: User, accessToken: string) => {
    setUser(user);
    localStorage.setItem("accessToken", accessToken);
     localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("accessToken");

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
