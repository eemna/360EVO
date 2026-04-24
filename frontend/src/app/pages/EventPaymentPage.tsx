import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import api from "../../services/axios";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  Lock,
  Calendar,
  MapPin,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface EventInfo {
  id: string;
  title: string;
  date: string;
  location?: string;
  price: number;
  coverImage?: string;
}

function PaymentForm({
  clientSecret,
  event,
  onSuccess,
}: {
  clientSecret: string;
  event: EventInfo;
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

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card: cardElement },
        },
      );

      if (error) {
        setCardError(error.message || "Payment failed");
        showToast({
          type: "error",
          title: "Payment failed",
          message: error.message || "",
        });
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        try {
          await api.post("/payments/confirm", {
            paymentIntentId: paymentIntent.id,
          });
        } catch (err) {
          console.error("Confirm failed:", err);
        }
        showToast({
          type: "success",
          title: "Payment successful!",
          message: `You're registered for "${event.title}"`,
        });
        onSuccess();
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card input */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <label className="text-xs font-medium text-gray-600 block mb-3 flex items-center gap-1.5">
          <CreditCard className="size-3.5" />
          Card Details
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "14px",
                color: "#374151",
                fontFamily: "inherit",
                "::placeholder": { color: "#9ca3af" },
              },
              invalid: { color: "#dc2626" },
            },
          }}
        />
      </div>

      {cardError && (
        <p className="text-sm text-red-600 flex items-center gap-1.5">
          <span className="text-red-500">⚠</span>
          {cardError}
        </p>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Lock className="size-3" />
        <span>
          Payments are processed securely by Stripe. We never store your card
          details.
        </span>
      </div>

      <Button
        className="w-full bg-green-600 hover:bg-green-700 gap-2 h-11 text-base font-semibold"
        onClick={handlePay}
        disabled={paying || !stripe}
      >
        {paying ? (
          <>
            <LoadingSpinner size="sm" className="text-white" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="size-4" />
            Pay ${event.price}
          </>
        )}
      </Button>
    </div>
  );
}

function SuccessScreen({
  event,
  onDone,
}: {
  event: EventInfo;
  onDone: () => void;
}) {
  return (
    <Card className="border-2 border-green-200 bg-green-50">
      <CardContent className="py-12 text-center space-y-4">
        <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-green-900">You're registered!</h2>
        <p className="text-green-700 text-sm">
          Your spot for <strong>{event.title}</strong> is confirmed.
        </p>
        <Button onClick={onDone} className="bg-green-600 hover:bg-green-700">
          View Event
        </Button>
      </CardContent>
    </Card>
  );
}

export default function EventPaymentPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const { data: eventData } = await api.get(`/events/${eventId}`);
        setEvent({
          id: eventData.id,
          title: eventData.title,
          date: eventData.date,
          location: eventData.location,
          price: Number(eventData.price),
          coverImage: eventData.coverImage,
        });

        if (Number(eventData.price) === 0) {
          await api.post(`/events/${eventId}/register`);
          showToast({
            type: "success",
            title: "Registered!",
            message: "You're registered for this free event.",
          });
          navigate(`/app/events/${eventId}`);
          return;
        }

        // Create payment intent
        const { data: intentData } = await api.post("/payments/create-intent", {
          eventId,
        });
        setClientSecret(intentData.clientSecret);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to initialize payment";
        showToast({ type: "error", title: "Error", message: msg });
        navigate(`/app/events/${eventId}`);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (loading || !event) {
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
        <SuccessScreen
          event={event}
          onDone={() => navigate(`/app/events/${eventId}`)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/app/events/${eventId}`)}
        className="gap-1 text-gray-500 -ml-2"
      >
        <ArrowLeft className="size-4" />
        Back to Event
      </Button>

      <h1 className="text-2xl font-bold text-gray-900">
        Complete Registration
      </h1>

      {/* Event summary */}
      <Card className="border border-gray-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={event.title}
                className="size-14 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="size-14 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="size-6 text-indigo-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {event.title}
              </h3>
              <div className="space-y-0.5 mt-1">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {event.location && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="size-3" />
                    {event.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order summary */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Event Ticket</span>
            <span className="font-medium">${event.price}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-100 pt-2 font-semibold">
            <span>Total</span>
            <span className="text-green-600">${event.price}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment form */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="size-4" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                event={event}
                onSuccess={() => setPaid(true)}
              />
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
