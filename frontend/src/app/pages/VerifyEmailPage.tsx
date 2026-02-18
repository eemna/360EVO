import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import api from "../../services/axios";
import { AxiosError } from "axios";
import { useToast } from "../../context/ToastContext";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

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
        await api.post("/auth/verify-email", { token });

        showToast({
          type: "success",
          title: "Email Verified 🎉",
          message: "Your email has been successfully verified.",
        });

        setMessage("Email successfully verified.");
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
  }, [token, showToast]);


  //  Resend verification email
  const handleResend = async () => {
    const email = localStorage.getItem("pendingEmail");

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
    <div className="min-h-screen bg-[#e8eef5] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#4c6fff] rounded-lg p-3">
            <Mail className="w-6 h-6 text-white" />
          </div>
        </div>

        <h1 className="text-center mb-4">Verify your email</h1>

        {loading && <p className="text-center text-gray-500">Verifying...</p>}

        {!loading && error && (
          <p className="text-red-600 text-center">{error}</p>
        )}

        {!loading && !error && message && (
          <p className="text-green-600 text-center">{message}</p>
        )}

        {/* Resend Button */}
        {!loading && !token && (
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full mt-4"
            disabled={resent}
          >
            {resent ? "Email sent!" : "Resend verification email"}
          </Button>
        )}

        {/* Back to Login */}
        <Button
          onClick={() => navigate("/login")}
          variant="primary"
          size="md"
          className="w-full mt-4"
        >
          Back to Login
        </Button>
      </div>
    </div>
  );
}
