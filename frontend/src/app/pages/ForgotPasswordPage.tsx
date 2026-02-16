import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from "react-router";
import api from "../../services/axios";
import { AxiosError } from "axios";
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from "../components/ui/LoadingSpinner";


export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();


  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
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

    const message =
      error.response?.data?.message || "Something went wrong";

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
    <div className="min-h-screen bg-[#e8eef5] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#4c6fff] rounded-lg p-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center mb-2">Forgot Password</h1>
        <p className="text-center text-muted-foreground mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
         <p className="text-red-800 text-center">{error}</p>
        </div>
                )}


        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
                      }
                className="bg-input-background border-0"
                required
              />
            </div>
            
            <Button
             type="submit"
             variant="primary"
             size="md"
             disabled={loading}
             className="w-full"
            > 
              {loading ? (
                <>
               <LoadingSpinner size="sm" />
                Sending...
                </> ) : ( "Send Reset Link" )}
            </Button>

          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-center">
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
            onClick={() => navigate("/login")}
            className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
