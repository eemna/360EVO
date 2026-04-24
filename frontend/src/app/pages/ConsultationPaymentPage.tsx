import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ArrowLeft, Lock, CreditCard, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import api from "../../services/axios";
import { useToast } from "../../context/ToastContext";

interface BookingDetail {
  id: string;
  startDateTime: string;
  endDateTime: string;
  duration: number;
  price: number;
  status: string;
  topic: string;
  meetingType?: "VIDEO" | "IN_PERSON";
  expert: { id: string; name: string };
  member: { id: string; name: string };
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({
  clientSecret,
  amount,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useToast();
  const [paying, setPaying] = useState(false);
  const [cardError, setCardError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    try {
      setPaying(true);
      setCardError("");

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: { card: cardElement } },
      );

      if (error) {
        setCardError(error.message || "Payment failed");
        return;
      }

if (paymentIntent?.status === "succeeded") {
  await api.post("/payments/consultation/confirm", {
    paymentIntentId: paymentIntent.id,
  });
  showToast({ type: "success", title: "Payment Confirmed 🎉", 
    message: "Your session is now fully confirmed!" });
  onSuccess();
}
    } catch {
      setCardError("Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Consultation fee</span>
          <span className="font-semibold">${amount}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-indigo-600">${amount}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <CreditCard className="size-4" /> Card details
        </label>
        <div className="border rounded-lg p-3 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1f2937",
                  "::placeholder": { color: "#9ca3af" },
                },
              },
            }}
          />
        </div>
        {cardError && <p className="text-sm text-red-600">{cardError}</p>}
      </div>

      <Button
        type="submit"
        disabled={paying || !stripe}
        className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
      >
        {paying ? (
          <>
            <LoadingSpinner size="sm" /> Processing...
          </>
        ) : (
          <>
            <Lock className="size-4" /> Pay ${amount}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-400">
        <Lock className="size-3 inline mr-1" />
        Secured by Stripe. Your card details are never stored.
      </p>
    </form>
  );
}

export default function ConsultationPaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) return;

    api
      .get("/consultations")
      .then(({ data }: { data: BookingDetail[] }) => {
        const found = data.find((b) => b.id === bookingId);
        if (!found) {
          setError("Booking not found");
          return;
        }
        if (found.status !== "PENDING_PAYMENT") {
          setError("This booking is not awaiting payment.");
          return;
        }
        setBooking(found);
        return api.post("/consultations/create-payment-intent", { bookingId });
      })
      .then((res) => {
        if (res) {
          setClientSecret(res.data.clientSecret);
          setAmount(res.data.amount);
        }
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load payment"),
      )
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading)
    return (
      <div className="flex justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );

  if (error)
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );

  return (
    <div className="max-w-lg mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="-ml-2 mb-6"
      >
        <ArrowLeft className="size-4 mr-2" /> Back
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
          <p className="text-gray-500 text-sm">
            Your slot was accepted — pay to lock it in
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking && (
            <div className="bg-indigo-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="size-4 text-indigo-600" />
                <span>
                  {format(
                    new Date(booking.startDateTime),
                    "EEEE, MMMM d, yyyy",
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="size-4 text-indigo-600" />
                <span>
                  {format(new Date(booking.startDateTime), "HH:mm")} ·{" "}
                  {booking.duration} min
                </span>
              </div>
            </div>
          )}

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                clientSecret={clientSecret}
                amount={amount}
                onSuccess={() => navigate(-1)}
              />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
