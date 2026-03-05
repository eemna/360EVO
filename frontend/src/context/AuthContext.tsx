import { createContext } from "react";
export interface WeeklyAvailability {
  id?: string;
  day: number;   
  startTime: string | null;
  endTime: string | null;
  enabled: boolean;
}
export interface Profile {
  bio: string | null;
  location: string | null;
  linkedIn: string | null;
  avatar: string | null;

  phone: string | null;

  companyName: string | null;
  stage: string | null;

  hourlyRate: number | null;
  yearsOfExperience: number | null;

  expertise: string[];
  industries: string[] | null;
  certifications: string[] | null;

  availabilityStatus: string | null;

  weeklyAvailability: WeeklyAvailability[] | null;
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "EXPERT" | "STARTUP" | "INVESTOR" | "ADMIN";
  profile: Profile | null;
  computedStatus?: "AVAILABLE" | "BUSY" | "ON_LEAVE";
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
