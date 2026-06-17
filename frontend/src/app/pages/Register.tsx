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
import { Card, CardContent } from "../components/ui/card";
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
      /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
    );
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.role) {
      showToast({
        type: "warning",
        title: "Select a role",
        message: "Please choose your role.",
      });
      return;
    }

    if (currentStep === 2) {
      if (
        !formData.fullName ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        showToast({
          type: "warning",
          title: "Missing fields",
          message: "Please complete all required fields.",
        });
        return;
      }
      if (!isPasswordStrong(formData.password)) {
        showToast({
          type: "error",
          title: "Weak password",
          message:
            "Password must be at least 8 characters and include uppercase, lowercase, and number.",
        });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showToast({
          type: "error",
          title: "Password mismatch",
          message: "Passwords do not match.",
        });
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (formData.role === "startup" && !formData.companyName) {
      showToast({
        type: "warning",
        title: "Missing field",
        message: "Company name is required for startups.",
      });
      setLoading(false);
      return;
    }

    if (formData.role === "expert" && !formData.expertise) {
      showToast({
        type: "warning",
        title: "Missing field",
        message: "Expertise is required for experts.",
      });
      setLoading(false);
      return;
    }

    if (
      formData.role === "expert" &&
      formData.hourlyRate &&
      isNaN(Number(formData.hourlyRate))
    ) {
      showToast({
        type: "error",
        title: "Invalid value",
        message: "Hourly rate must be a valid number.",
      });
      setLoading(false);
      return;
    }
    try {
      await api.post("/auth/register", {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        companyName: formData.companyName,
        stage: formData.stage,
        expertise: formData.expertise
          ?.split(",")
          .map((e) => e.trim())
          .filter(Boolean),
        hourlyRate: formData.hourlyRate
          ? Number(formData.hourlyRate)
          : undefined,
      });

      showToast({
        type: "success",
        title: "Check your email",
        message: "We sent you a verification link.",
      });
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
  }[] = [
    {
      value: "member",
      label: "Member",
      icon: <User className="w-6 h-6" />,
      description: "Join the community, discover projects and experts.",
    },
    {
      value: "startup",
      label: "Startup",
      icon: <Briefcase className="w-6 h-6" />,
      description: "List your project and connect with experts and investors.",
    },
    {
      value: "expert",
      label: "Expert",
      icon: <Users className="w-6 h-6" />,
      description: "Offer consulting sessions and share your expertise.",
    },
    {
      value: "investor",
      label: "Investor",
      icon: <TrendingUp className="w-6 h-6" />,
      description: "Discover AI-matched startup projects to invest in.",
    },
  ];

  return (
    <div className="w-full bg-[#e8eef5] py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {/* Step indicators */}
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-medium transition-all ${
                    currentStep >= step
                      ? "bg-[#C9A84C] border-[#C9A84C] text-[#0D1B2A]"
                      : "bg-transparent border-white/20 text-white/40"
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-0.5 mx-2 transition-all ${
                      currentStep > step ? "bg-[#C9A84C]" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <Card className="bg-[#1A2A3A] border-white/10 rounded-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit}>
              {/* Step 1 - role selection */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-white">
                      Choose Your Role
                    </h2>
                    <p className="text-sm text-white/50 mt-1">
                      Select how you'll use 360EVO
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {roles.map(({ value, label, icon, description }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateFormData("role", value)}
                        className={`p-5 border-2 rounded-xl text-left transition-all ${
                          formData.role === value
                            ? "border-[#1D9E75] bg-[#1D9E75]/10"
                            : "border-white/10 hover:border-white/30 bg-white/5"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                            formData.role === value
                              ? "bg-[#1D9E75]/20"
                              : "bg-white/10"
                          }`}
                        >
                          <span
                            className={
                              formData.role === value
                                ? "text-[#1D9E75]"
                                : "text-white/50"
                            }
                          >
                            {icon}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white">{label}</h3>
                        <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                          {description}
                        </p>
                        {formData.role === value && (
                          <div className="mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-[#1D9E75]" />
                            <span className="text-xs font-medium text-[#1D9E75]">
                              Selected
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!formData.role}
                    className="w-full py-3 bg-[#C9A84C] hover:bg-[#D4B55C] text-[#0D1B2A] font-semibold rounded-lg transition-colors disabled:opacity-40"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Step 2 - basic info */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <h2 className="text-2xl text-center font-semibold text-white">
                    Basic Information
                  </h2>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white/80">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        updateFormData("fullName", e.target.value)
                      }
                      placeholder="Enter your full name"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/80">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        updateFormData("password", e.target.value)
                      }
                      placeholder="Min 8 chars, upper, lower, number"
                      autoComplete="new-password"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-0"
                    />
                    <PasswordStrengthBar password={formData.password} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white/80">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        updateFormData("confirmPassword", e.target.value)
                      }
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-0"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 py-3 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white rounded-lg"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 py-3 bg-[#C9A84C] hover:bg-[#D4B55C] text-[#0D1B2A] font-semibold rounded-lg"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3 - role details */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  {/* startup fields */}
                  {formData.role === "startup" && (
                    <>
                      <h2 className="text-2xl text-center font-semibold text-white">
                        Company Details
                      </h2>

                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-white/80">
                          Company Name
                        </Label>
                        <Input
                          id="companyName"
                          value={formData.companyName || ""}
                          onChange={(e) =>
                            updateFormData("companyName", e.target.value)
                          }
                          placeholder="Your company name"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white/80">Startup Stage</Label>
                        <Select
                          value={formData.stage}
                          onValueChange={(v) => updateFormData("stage", v)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white data-[placeholder]:text-white/50 focus:ring-[#1D9E75] focus:ring-offset-0">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent
                            className="bg-[#1A2A3A] border-white/20 text-white"
                            position="popper"
                          >
                            <SelectItem
                              value="IDEA"
                              className="text-white focus:bg-[#1D9E75]/20 focus:text-white"
                            >
                              Idea
                            </SelectItem>
                            <SelectItem
                              value="PROTOTYPE"
                              className="text-white focus:bg-[#1D9E75]/20 focus:text-white"
                            >
                              Prototype
                            </SelectItem>
                            <SelectItem
                              value="MVP"
                              className="text-white focus:bg-[#1D9E75]/20 focus:text-white"
                            >
                              MVP
                            </SelectItem>
                            <SelectItem
                              value="GROWTH"
                              className="text-white focus:bg-[#1D9E75]/20 focus:text-white"
                            >
                              Growth
                            </SelectItem>
                            <SelectItem
                              value="SCALING"
                              className="text-white focus:bg-[#1D9E75]/20 focus:text-white"
                            >
                              Scaling
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {formData.role === "expert" && (
                    <>
                      <h2 className="text-2xl text-center font-semibold text-white">
                        Expert Details
                      </h2>
                      <div className="space-y-2">
                        <Label htmlFor="expertise" className="text-white/80">
                          Expertise
                        </Label>
                        <Input
                          id="expertise"
                          value={formData.expertise || ""}
                          onChange={(e) =>
                            updateFormData("expertise", e.target.value)
                          }
                          placeholder="e.g. Business Strategy, Marketing"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate" className="text-white/80">
                          Hourly Rate ($)
                        </Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          value={formData.hourlyRate || ""}
                          onChange={(e) =>
                            updateFormData("hourlyRate", e.target.value)
                          }
                          placeholder="e.g. 80"
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-0"
                        />
                      </div>
                    </>
                  )}

                  {(formData.role === "investor" ||
                    formData.role === "member") && (
                    <div className="text-center space-y-4 py-4">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#1D9E75]/20 flex items-center justify-center">
                          {formData.role === "investor" ? (
                            <TrendingUp className="w-8 h-8 text-[#1D9E75]" />
                          ) : (
                            <User className="w-8 h-8 text-[#1D9E75]" />
                          )}
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-white">
                        Ready to Join as{" "}
                        {formData.role === "investor"
                          ? "an Investor"
                          : "a Member"}
                        ?
                      </h3>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-left text-sm space-y-2">
                        <p className="text-white/70">
                          <strong className="text-white">Name:</strong>{" "}
                          {formData.fullName}
                        </p>
                        <p className="text-white/70">
                          <strong className="text-white">Email:</strong>{" "}
                          {formData.email}
                        </p>
                        <p className="text-white/70">
                          <strong className="text-white">Role:</strong>{" "}
                          {formData.role}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 py-3 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white rounded-lg"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-[#C9A84C] hover:bg-[#D4B55C] text-[#0D1B2A] font-semibold rounded-lg disabled:opacity-50"
                    >
                      {loading
                        ? "Creating account..."
                        : "Complete Registration"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-sm text-black/50">
          Already have an account?{" "}
          <Link to="/login" className="text-[#1D9E75] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
