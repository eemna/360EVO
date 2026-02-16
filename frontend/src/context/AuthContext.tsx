import { createContext } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
