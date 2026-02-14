import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import api from "../../services/axios";
import { AxiosError } from "axios";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [message, setMessage] = useState("Verifying...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [resent, setResent] = useState(false);

  // 🔹 Auto verify when page loads
  useEffect(() => {
  if (!token) {
    setMessage("Please check your email for a verification link.");
    setLoading(false);
    return;
  }

  const verify = async () => {
    try {
      await api.post("/auth/verify-email", { token });
      setMessage("Email successfully verified.");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(
        error.response?.data?.message ||
        "Invalid or expired verification link."
      );
    } finally {
      setLoading(false);
    }
  };

  verify();
}, [token]);


  // 🔹 Resend verification email
const handleResend = async () => {
  const email = localStorage.getItem("pendingEmail");

  if (!email) {
    setError("No email found. Please login again.");
    return;
  }

  try {
    await api.post("/auth/resend-verification", { email });
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  } catch {
    setError("Failed to resend verification email.");
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

        {loading ? (
          <p className="text-center text-gray-500">Verifying...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : (
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
        className="w-full mt-4">
          Back to Login
        </Button>
      </div>
    </div>
  );
}
