import { Link, useNavigate } from "react-router";
import { useState } from "react";
import api from "../../services/axios";
import { AxiosError } from "axios";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { InputField } from '../components/ui/inputField';
import { Card } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {

  e.preventDefault();
  setError("");

  if (!role) {
    setError("Please select a role");
    return;
  }

  try {
    await api.post("/auth/register", {
      name,
      email,
      password,
      role,
    });

    navigate("/login");
  } catch (err) {
    const error = err as AxiosError<{ message: string }>;
    setError(error.response?.data?.message || "Registration failed");
  }
};


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-12">
      <Card className="w-full max-w-md p-8 border-none shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <span className="font-bold text-white">360</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Join 360EVO Today
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your account and start connecting
          </p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
         <InputField
  id="name"
  label="Full Name"
  value={name}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
  setName(e.target.value)
}

  placeholder="John Doe"
  required
/>


        <InputField
  id="email"
  label="Email"
  type="email"
  value={email}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
  setEmail(e.target.value)
}

  placeholder="you@example.com"
  required
/>


          <InputField
  id="password"
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="••••••••"
  required
/>


          <div className="space-y-2">
            <Label>I am a...</Label>
            <Select onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup Founder</SelectItem>
                <SelectItem value="expert">Expert / Mentor</SelectItem>
                <SelectItem value="member">Community Member</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="md"
            className="w-full"
            >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
