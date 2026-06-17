import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import api from "../../services/axios";
import { AxiosError } from "axios";
import { useToast } from "../../context/ToastContext";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });

      showToast({
        type: "success",
        title: "Email Sent 📩",
        message: "Password reset link has been sent to your email.",
      });

      setSent(true);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;

      const message = error.response?.data?.message || "Something went wrong";

      showToast({
        type: "error",
        title: "Request Failed",
        message,
      });

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center bg-[#e8eef5] px-4 py-8">
      <div className="bg-[#1A2A3A] border border-white/10 rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#C9A84C]">
            <span className="font-bold text-[#0D1B2A] text-lg">360</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-white text-xl font-semibold mb-2">
          Forgot Password
        </h1>
        <p className="text-center text-white/60 text-sm mb-6">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80">Email</Label>
              <Input
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-0"
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>

            <Button
              className="w-full py-3 bg-[#C9A84C] hover:bg-[#D4B55C] text-[#0D1B2A] font-semibold rounded-lg"
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-[#1D9E75]/10 border border-[#1D9E75]/30 rounded-md">
              <p className="text-[#1D9E75] text-center">
                Password reset link sent to your email
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Return to Login
            </Button>
          </div>
        )}

        {/* Back to Login Link */}
        <div className="text-center mt-6">
          <button
            className="text-white/50 hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors"
            onClick={() => navigate("/login")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
