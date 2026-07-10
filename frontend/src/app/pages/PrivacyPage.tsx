export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-white/70">
      <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            1. Data We Collect
          </h2>
          <p>
            We collect account information you provide when registering
            (name, email, profile details), materials you upload to the
            platform (e.g., pitch decks, documents, and other files
            submitted for matching or review), and usage analytics
            (interactions with the platform, log data, and device
            information).
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            2. How We Use Your Data
          </h2>
          <p>
            Your data is used to operate the platform, run our matching
            algorithm to connect startups, investors, and consultants, send
            you notifications and communications related to your account,
            and improve the quality and reliability of our services.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            3. Who We Share Data With
          </h2>
          <p>
            We share your information only with matched counterparties on
            the platform. You retain control over what profile information
            is visible to matches. We do not sell your data to third
            parties.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            4. Data Security
          </h2>
          <p>
            Passwords are hashed using bcrypt and are never stored as plain
            text. Session tokens are hashed before being stored in our
            database. Data is transmitted over HTTPS.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            5. Your Rights
          </h2>
          <p>
            You may request access to the personal data we hold about you,
            ask us to correct inaccurate information, or request deletion of
            your account and associated data, subject to any legal or
            contractual retention requirements. To exercise these rights,
            contact us using the details below.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            6. Contact
          </h2>
          <p>For privacy concerns, contact us at privacy@360evo.com</p>
        </div>
      </section>
    </div>
  );
}