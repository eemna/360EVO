import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import api from "../../services/axios";
import { AxiosError } from "axios";
import { useToast } from "../../context/ToastContext";
import { useLocation } from "react-router";
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const pendingEmail = (location.state as { pendingEmail?: string })
    ?.pendingEmail;
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const email = searchParams.get("email");
  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) {
      showToast({
        type: "info",
        title: "Verification Required",
        message: "Please check your email for a verification link.",
      });
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        if (type === "change-email") {
          await api.post("/auth/verify-new-email", { token, email });
        } else {
          await api.post("/auth/verify-email", { token });
        }

        showToast({
          type: "success",
          title: "Email Verified 🎉",
          message: "Your email has been successfully verified.",
        });

        setMessage("Email successfully verified.");
        if (type === "change-email") {
          navigate("/app/settings");
        }
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;

        const message =
          error.response?.data?.message ||
          "Invalid or expired verification link.";

        showToast({
          type: "error",
          title: "Verification Failed",
          message,
        });

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, showToast, type, email, navigate]);

  const handleResend = async () => {
    const email = pendingEmail;

    if (!email) {
      showToast({
        type: "error",
        title: "No Email Found",
        message: "Please login again.",
      });
      return;
    }

    try {
      await api.post("/auth/resend-verification", { email });
      showToast({
        type: "success",
        title: "Email Sent 📩",
        message: "Verification email has been resent.",
      });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch {
      showToast({
        type: "error",
        title: "Resend Failed",
        message: "Failed to resend verification email.",
      });
    }
  };

  return (
    <div className="w-full flex items-center bg-[#e8eef5] justify-center px-4 py-8">
      <div className="bg-[#1A2A3A] border border-white/10 rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#C9A84C]">
            <Mail className="w-6 h-6 text-[#0D1B2A]" />
          </div>
        </div>

        <h1 className="text-center text-white text-xl font-semibold mb-4">
          Verify your email
        </h1>

        {loading && <p className="text-center text-white/60">Verifying...</p>}

        {!loading && error && (
          <p className="text-red-400 text-center">{error}</p>
        )}

        {!loading && !error && message && (
          <p className="text-[#1D9E75] text-center">{message}</p>
        )}

        {/* Resend Button */}
        {!loading && !token && (
          <Button
            className="w-full mt-4 py-3 bg-transparent border border-white/20 text-white hover:bg-white/10 rounded-lg"
            onClick={handleResend}
            variant="outline"
            disabled={resent}
          >
            {resent ? "Email sent!" : "Resend verification email"}
          </Button>
        )}

        {/* Back to Login */}
        <Button
          className="w-full mt-4 py-3 bg-[#C9A84C] hover:bg-[#D4B55C] text-[#0D1B2A] font-semibold rounded-lg"
          onClick={() => navigate("/login")}
          variant="primary"
          size="md"
        >
          Back to Login
        </Button>
      </div>
    </div>
  );
}
