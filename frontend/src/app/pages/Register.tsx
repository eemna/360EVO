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

import { Briefcase, Users, User, CheckCircle2 } from "lucide-react";

type Role = "member" | "startup" | "expert" | null;

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
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isPasswordStrong = (password: string) => {
    if (password.length < 8) return false;
    return (
      /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
    );
  };

  const handleNext = () => {
    // STEP 1 → role validation
    if (currentStep === 1 && !formData.role) {
      showToast({
        type: "warning",
        title: "Select a role",
        message: "Please choose your role.",
      });
      return;
    }

    // STEP 2 → basic info validation
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

      showToast({
        type: "success",
        title: "Check your email",
        message: "We sent you a verification link.",
      });

      navigate("/login");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const message = error.response?.data?.message || "Registration failed";

      showToast({
        type: "error",
        title: "Registration Failed",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 border-gray-200">
      <div className="w-full max-w-2xl">
        {/* PROGRESS */}
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                {/* Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-medium transition-all
                  ${
                    currentStep >= step
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>

                {/* Line */}
                {step < 3 && (
                  <div
                    className={`w-16 h-0.5 mx-2 transition-all
                    ${currentStep > step ? "bg-blue-600" : "bg-gray-300"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="p-8 shadow-md border border-gray-200">
          <form onSubmit={handleSubmit}>
            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-center">
                  Choose Your Role
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => updateFormData("role", "member")}
                    className={`p-6 border-2 rounded-lg ${
                      formData.role === "member"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <User />
                    <h3 className="font-semibold">Member</h3>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateFormData("role", "startup")}
                    className={`p-6 border-2 rounded-lg ${
                      formData.role === "startup"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <Briefcase />
                    <h3 className="font-semibold">Startup</h3>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateFormData("role", "expert")}
                    className={`p-6 border-2 rounded-lg ${
                      formData.role === "expert"
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200"
                    }`}
                  >
                    <Users />
                    <h3 className="font-semibold">Expert</h3>
                  </button>
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

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl text-center font-semibold">
                  Basic Information
                </h2>

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
                    onChange={(e) =>
                      updateFormData("confirmPassword", e.target.value)
                    }
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} className="flex-1">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {formData.role === "startup" && (
                  <>
                    <Label>Company Name</Label>
                    <Input
                      value={formData.companyName || ""}
                      onChange={(e) =>
                        updateFormData("companyName", e.target.value)
                      }
                    />

                    <Label>Startup Stage</Label>
                    <Select
                      value={formData.stage}
                      onValueChange={(value) => updateFormData("stage", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ideation">Ideation</SelectItem>
                        <SelectItem value="mvp">MVP</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}

                {formData.role === "expert" && (
                  <>
                    <Label>Expertise</Label>
                    <Input
                      value={formData.expertise || ""}
                      onChange={(e) =>
                        updateFormData("expertise", e.target.value)
                      }
                    />

                    <Label>Hourly Rate</Label>
                    <Input
                      type="number"
                      value={formData.hourlyRate || ""}
                      onChange={(e) =>
                        updateFormData("hourlyRate", e.target.value)
                      }
                    />
                  </>
                )}
                {formData.role === "member" && (
                  <div className="text-center space-y-4 py-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-8 h-8 text-green-600" />
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold">
                      Ready to Join as a Member?
                    </h3>

                    <p className="text-gray-600 text-sm">
                      You don’t need to provide additional details. Please
                      confirm your registration below.
                    </p>

                    {/* Optional Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-2 border-gray-200">
                      <p>
                        <strong>Name:</strong> {formData.fullName}
                      </p>
                      <p>
                        <strong>Email:</strong> {formData.email}
                      </p>
                      <p>
                        <strong>Role:</strong> Member
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating..." : "Complete Registration"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>

        <p className="text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
