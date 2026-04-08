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
import { Badge } from "../components/ui/badge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ArrowLeft, Lock, CreditCard } from "lucide-react";
import api from "../../services/axios";
import { useToast } from "../../context/ToastContext";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({
  clientSecret,
  amount,
  eventTitle,
  eventId,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  eventTitle: string;
  eventId: string;
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
        let attempts = 0;
        while (attempts < 10) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          try {
            const { data } = await api.get(`/events/${eventId}`);
            if (data.isRegistered) {
              showToast({
                type: "success",
                title: "Payment successful! 🎉",
                message: `You're registered for "${eventTitle}"`,
              });
              onSuccess();
              return;
            }
          } catch {
            // continue polling
          }
          attempts++;
        }
        showToast({
          type: "success",
          title: "Payment Received",
          message: "Your registration will be confirmed shortly.",
        });
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
      <div className="bg-gray-50 p-4 rounded-xl space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Event ticket</span>
          <span className="font-semibold">${amount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Platform fee</span>
          <span className="font-semibold">$0.00</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-indigo-600">${amount}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <CreditCard className="size-4" />
          Card details
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

export default function EventPaymentPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eventId) return;

    api
      .post("/payments/create-intent", { eventId })
      .then(({ data }) => {
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setEventTitle(data.eventTitle);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Could not load payment");
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSuccess = () => {
    navigate(`/app/events/${eventId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="-ml-2 mb-6"
      >
        <ArrowLeft className="size-4 mr-2" />
        Back to Event
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Complete Registration</CardTitle>
            <Badge className="bg-green-100 text-green-700">Secure</Badge>
          </div>
          <p className="text-gray-600 text-sm mt-1">{eventTitle}</p>
        </CardHeader>
        <CardContent>
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                clientSecret={clientSecret}
                amount={amount}
                eventTitle={eventTitle}
                eventId={eventId!}
                onSuccess={handleSuccess}
              />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
