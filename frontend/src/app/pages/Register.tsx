import { useState } from "react";
import { useNavigate, Link } from "react-router";
import api from "../../services/axios";
import { AxiosError } from "axios";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card } from "../components/ui/card";
import { PasswordStrengthBar } from "../components/ui/password-strength-bar";
import { useToast } from "../../context/ToastContext";

import { Briefcase, Users, User, TrendingUp, CheckCircle2 } from "lucide-react";

type Role = "member" | "startup" | "expert" | "investor" | null;

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  companyName?: string;
  stage?: string;
  expertise?: string;
  hourlyRate?: string;
}

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: null,
  });

  const updateFormData = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isPasswordStrong = (password: string) => {
    if (password.length < 8) return false;
    return (
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.role) {
      showToast({ type: "warning", title: "Select a role", message: "Please choose your role." });
      return;
    }

    if (currentStep === 2) {
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        showToast({ type: "warning", title: "Missing fields", message: "Please complete all required fields." });
        return;
      }
      if (!isPasswordStrong(formData.password)) {
        showToast({
          type: "error",
          title: "Weak password",
          message: "Password must be at least 8 characters and include uppercase, lowercase, and number.",
        });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showToast({ type: "error", title: "Password mismatch", message: "Passwords do not match." });
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        companyName: formData.companyName,
        stage: formData.stage,
        expertise: formData.expertise,
        hourlyRate: formData.hourlyRate,
      });

      showToast({ type: "success", title: "Check your email", message: "We sent you a verification link." });
      navigate("/login");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      showToast({
        type: "error",
        title: "Registration Failed",
        message: error.response?.data?.message || "Registration failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const roles: {
    value: Role;
    label: string;
    icon: React.ReactNode;
    description: string;
    color: string;
    border: string;
  }[] = [
    {
      value: "member",
      label: "Member",
      icon: <User className="w-6 h-6" />,
      description: "Join the community, discover projects and experts.",
      color: "bg-green-50",
      border: "border-green-500",
    },
    {
      value: "startup",
      label: "Startup",
      icon: <Briefcase className="w-6 h-6" />,
      description: "List your project and connect with experts and investors.",
      color: "bg-blue-50",
      border: "border-blue-500",
    },
    {
      value: "expert",
      label: "Expert",
      icon: <Users className="w-6 h-6" />,
      description: "Offer consulting sessions and share your expertise.",
      color: "bg-purple-50",
      border: "border-purple-500",
    },
    {
      value: "investor",
      label: "Investor",
      icon: <TrendingUp className="w-6 h-6" />,
      description: "Discover AI-matched startup projects to invest in.",
      color: "bg-amber-50",
      border: "border-amber-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-medium transition-all ${
                    currentStep >= step
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-0.5 mx-2 transition-all ${
                      currentStep > step ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="p-8 shadow-md border border-gray-200">
          <form onSubmit={handleSubmit}>

            {/* ── STEP 1: Choose Role ── */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold">Choose Your Role</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select how you'll use 360EVO
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roles.map(({ value, label, icon, description, color, border }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateFormData("role", value)}
                      className={`p-5 border-2 rounded-xl text-left transition-all ${
                        formData.role === value
                          ? `${border} ${color}`
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                          formData.role === value ? color : "bg-gray-100"
                        }`}
                      >
                        <span
                          className={
                            formData.role === value
                              ? value === "member"
                                ? "text-green-600"
                                : value === "startup"
                                ? "text-blue-600"
                                : value === "expert"
                                ? "text-purple-600"
                                : "text-amber-600"
                              : "text-gray-500"
                          }
                        >
                          {icon}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{label}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {description}
                      </p>
                      {formData.role === value && (
                        <div className="mt-2 flex items-center gap-1">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              value === "member"
                                ? "text-green-600"
                                : value === "startup"
                                ? "text-blue-600"
                                : value === "expert"
                                ? "text-purple-600"
                                : "text-amber-600"
                            }`}
                          />
                          <span className="text-xs font-medium text-gray-600">Selected</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.role}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* ── STEP 2: Basic Info ── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl text-center font-semibold">Basic Information</h2>

                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => updateFormData("fullName", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                  />
                  <PasswordStrengthBar password={formData.password} />
                </div>

                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" onClick={handleBack} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} className="flex-1">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Role-specific details ── */}
            {currentStep === 3 && (
              <div className="space-y-4">

                {/* STARTUP */}
                {formData.role === "startup" && (
                  <>
                    <h2 className="text-2xl text-center font-semibold">Company Details</h2>
                    <div>
                      <Label>Company Name</Label>
                      <Input
                        value={formData.companyName || ""}
                        onChange={(e) => updateFormData("companyName", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Startup Stage</Label>
                      <Select
                        value={formData.stage}
                        onValueChange={(value) => updateFormData("stage", value)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDEA">Idea</SelectItem>
                          <SelectItem value="PROTOTYPE">Prototype</SelectItem>
                          <SelectItem value="MVP">MVP</SelectItem>
                          <SelectItem value="GROWTH">Growth</SelectItem>
                          <SelectItem value="SCALING">Scaling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* EXPERT */}
                {formData.role === "expert" && (
                  <>
                    <h2 className="text-2xl text-center font-semibold">Expert Details</h2>
                    <div>
                      <Label>Expertise</Label>
                      <Input
                        value={formData.expertise || ""}
                        onChange={(e) => updateFormData("expertise", e.target.value)}
                        placeholder="e.g. Business Strategy, Marketing"
                      />
                    </div>
                    <div>
                      <Label>Hourly Rate ($)</Label>
                      <Input
                        type="number"
                        value={formData.hourlyRate || ""}
                        onChange={(e) => updateFormData("hourlyRate", e.target.value)}
                        placeholder="e.g. 80"
                      />
                    </div>
                  </>
                )}

                {/* INVESTOR */}
                {formData.role === "investor" && (
                  <div className="text-center space-y-4 py-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-amber-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold">Ready to Join as an Investor?</h3>
                    <p className="text-gray-600 text-sm max-w-sm mx-auto">
                      After registration you'll be guided through a quick setup wizard to configure
                      your investment thesis and preferences. Our AI will then match you with the
                      most relevant startup projects.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left text-sm space-y-2">
                      <p><strong>Name:</strong> {formData.fullName}</p>
                      <p><strong>Email:</strong> {formData.email}</p>
                      <p><strong>Role:</strong> Investor</p>
                    </div>
                  </div>
                )}

                {/* MEMBER */}
                {formData.role === "member" && (
                  <div className="text-center space-y-4 py-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold">Ready to Join as a Member?</h3>
                    <p className="text-gray-600 text-sm">
                      No additional details needed. Confirm your registration below.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-2 border border-gray-200">
                      <p><strong>Name:</strong> {formData.fullName}</p>
                      <p><strong>Email:</strong> {formData.email}</p>
                      <p><strong>Role:</strong> Member</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" onClick={handleBack} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating account..." : "Complete Registration"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>

        <p className="text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}