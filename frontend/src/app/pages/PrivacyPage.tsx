export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            1. Data We Collect
          </h2>
          <p>
            We collect information you provide when registering, such as your
            name, email, and profile details. We also collect usage data to
            improve our platform.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            2. How We Use Your Data
          </h2>
          <p>
            Your data is used to provide and improve 360EVO services, send
            notifications, and match investors with startups.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            3. Cookies
          </h2>
          <p>
            We use cookies for authentication and session management. You can
            control cookies through your browser settings.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            4. Contact
          </h2>
          <p>For privacy concerns, contact us at privacy@360evo.com</p>
        </div>
      </section>
    </div>
  );
}
