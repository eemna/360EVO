const faqs = [
  {
    q: "What is 360EVO?",
    a: "360EVO is a platform connecting startups, investors, experts, and members to collaborate and grow.",
  },
  {
    q: "How do I become an expert?",
    a: "Go to Settings and apply for expert status. Your application will be reviewed by an admin.",
  },
  {
    q: "How does investor matching work?",
    a: "Complete your investor profile with your preferences and our AI matches you with relevant startups automatically.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use HTTPS, encrypted tokens, and follow best practices for data protection.",
  },
  {
    q: "How do I cancel a booking?",
    a: "Go to your consultations page and cancel before the scheduled time. Refund policies apply.",
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">FAQ</h1>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-gray-200 pb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              {faq.q}
            </h2>
            <p className="text-sm leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
