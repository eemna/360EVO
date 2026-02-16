import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router";
import api from "../../services/axios";
import { AxiosError } from "axios";
import { useToast } from "../../context/ToastContext";
import { PasswordStrengthBar } from "../components/ui/password-strength-bar";


export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (newPassword !== confirmPassword) {
    showToast({
      type: "warning",
      title: "Password Mismatch",
      message: "Passwords do not match.",
    });
    return;
  }

  if (newPassword.length < 8) {
    showToast({
      type: "warning",
      title: "Weak Password",
      message: "Password must be at least 8 characters.",
    });
    return;
  }

  setLoading(true);

  try {
    await api.post("/auth/reset-password", {
      token,
      newPassword,
    });

    showToast({
      type: "success",
      title: "Password Updated 🎉",
      message: "Your password has been successfully updated.",
    });

    setSuccess(true);

    // Optional: auto redirect after 2 seconds
    setTimeout(() => {
      navigate("/login");
    }, 2000);

  } catch (err) {
    const error = err as AxiosError<{ message: string }>;

    const message =
      error.response?.data?.message || "Invalid or expired token";

    showToast({
      type: "error",
      title: "Reset Failed",
      message,
    });

    setError(message);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-[#e8eef5] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#4c6fff] rounded-lg p-3">
            {success ? (
              <CheckCircle className="w-6 h-6 text-white" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>

        {!success ? (
          <>
            {/* Title */}
            <h1 className="text-center mb-2">Reset Password</h1>
            <p className="text-center text-muted-foreground mb-6">
              Enter your new password below.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.target.value)
                    }

                  className="bg-input-background border-0"
                  required
                />
                <PasswordStrengthBar password={newPassword} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                  }

                  className="bg-input-background border-0"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-center">{error}</p>
                </div>
              )}

              <Button
               type="submit"
               variant="primary"
               size="md"
               disabled={loading}
               className="w-full">
              {loading ? "Updating..." : "Reset Password"}
              </Button>

            </form>
          </>
        ) : (
          <div className="space-y-4">
            <h1 className="text-center mb-2">Success!</h1>
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-center">
                Password successfully updated
              </p>
            </div>
            <Button
              onClick={() => navigate("/login")}
              variant="primary"
              size="md"
              className="w-full">
              Return to Login
            </Button>
          </div>
        )}

        {/* Back to Login Link */}
        {!success && (
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/login")}
              className="text-muted-foreground hover:text-foreground"
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
