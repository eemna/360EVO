import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import api from "../../services/axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CreditCard, Lock, BookOpen, CheckCircle2, ArrowLeft } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface ProgramInfo {
  id: string;
  title: string;
  type: string;
  price: number;
  startDate: string;
  coverImage?: string;
}

function PaymentForm({
  clientSecret,
  program,
  onSuccess,
}: {
  clientSecret: string;
  program: ProgramInfo;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useToast();
  const [paying, setPaying] = useState(false);
  const [cardError, setCardError] = useState("");

  const handlePay = async () => {
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    try {
      setPaying(true);
      setCardError("");

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        setCardError(error.message || "Payment failed");
        showToast({ type: "error", title: "Payment failed", message: error.message || "" });
        return;
      }

if (paymentIntent?.status === "succeeded") {
  try {
    await api.post("/payments/program/confirm", { paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error("Confirm failed:", err);
  }
  showToast({ type: "success", title: "Enrollment confirmed!", message: `You're now enrolled in "${program.title}"` });
  onSuccess();
}
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <label className="text-xs font-medium text-gray-600 block mb-3 flex items-center gap-1.5">
          <CreditCard className="size-3.5" />
          Card Details
        </label>
        <CardElement
          options={{
            style: {
              base: { fontSize: "14px", color: "#374151", fontFamily: "inherit", "::placeholder": { color: "#9ca3af" } },
              invalid: { color: "#dc2626" },
            },
          }}
        />
      </div>

      {cardError && (
        <p className="text-sm text-red-600 flex items-center gap-1.5">
          <span>⚠</span> {cardError}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Lock className="size-3" />
        <span>Payments are processed securely by Stripe.</span>
      </div>

      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2 h-11 text-base font-semibold"
        onClick={handlePay}
        disabled={paying || !stripe}
      >
        {paying ? (
          <><LoadingSpinner size="sm" className="text-white" /> Processing...</>
        ) : (
          <><Lock className="size-4" /> Pay ${program.price}</>
        )}
      </Button>
    </div>
  );
}

function SuccessScreen({ program, onDone }: { program: ProgramInfo; onDone: () => void }) {
  return (
    <Card className="border-2 border-green-200 bg-green-50">
      <CardContent className="py-12 text-center space-y-4">
        <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-green-900">You're enrolled!</h2>
        <p className="text-green-700 text-sm">
          Your spot in <strong>{program.title}</strong> is confirmed.
        </p>
        <Button onClick={onDone} className="bg-indigo-600 hover:bg-indigo-700">
          View Program
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ProgramPaymentPage() {
  const { id: programId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data: intentData } = await api.post("/payments/program/create-intent", { programId });
        
        const { data: programData } = await api.get(`/programs/${programId}`);
        setProgram({
          id: programData.id,
          title: programData.title,
          type: programData.type,
          price: intentData.amount,
          startDate: programData.startDate,
          coverImage: programData.coverImage,
        });
        setClientSecret(intentData.clientSecret);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to initialize payment";
        showToast({ type: "error", title: "Error", message: msg });
        navigate(`/app/programs/${programId}`);
      } finally {
        setLoading(false);
      }
    };
    if (programId) init();
  }, [programId,navigate, showToast]);

  if (loading || !program) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (paid) {
    return (
      <div className="max-w-md mx-auto">
        <SuccessScreen program={program} onDone={() => navigate(`/app/programs/${programId}`)} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/app/programs/${programId}`)} className="gap-1 text-gray-500 -ml-2">
        <ArrowLeft className="size-4" /> Back to Program
      </Button>

      <h1 className="text-2xl font-bold text-gray-900">Complete Enrollment</h1>

      <Card className="border border-gray-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="size-14 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <BookOpen className="size-6 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{program.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{program.type}</p>
              <p className="text-xs text-gray-500">
                Starts {new Date(program.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Program Fee</span>
            <span className="font-medium">${program.price}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-100 pt-2 font-semibold">
            <span>Total</span>
            <span className="text-indigo-600">${program.price}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="size-4" /> Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
              <PaymentForm clientSecret={clientSecret} program={program} onSuccess={() => setPaid(true)} />
            </Elements>
          ) : (
            <div className="py-4 flex justify-center">
              <LoadingSpinner size="md" className="text-indigo-600" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}