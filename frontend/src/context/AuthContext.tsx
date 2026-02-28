import { createContext } from "react";

export interface Profile {
  bio: string;
  location: string;
  linkedIn: string | null;
  avatar: string | null;
  companyName: string | null;
  stage: string | null;
  hourlyRate: number | null;
  expertise: string[];
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "EXPERT" | "STARTUP" | "INVESTOR" | "ADMIN";
  profile: Profile | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
