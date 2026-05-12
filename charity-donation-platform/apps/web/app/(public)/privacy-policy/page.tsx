export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-4xl px-6 py-14">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-4 font-serif text-4xl font-bold text-foreground">Privacy Policy</h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl space-y-4 px-6 py-12 text-sm leading-relaxed text-muted-foreground">
        <p>
          Your privacy is important to us. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you visit our platform.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">Information We Collect</h2>
        <p>
          We may collect personal information that you voluntarily provide when you register,
          make a donation, subscribe to our newsletter, or contact us. This includes your name,
          email address, phone number, and payment information.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">How We Use Your Information</h2>
        <p>
          We use collected information to process donations, improve our services, communicate
          with you about campaigns, send newsletters (with your consent), and comply with legal
          obligations.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information.
          However, no method of transmission over the Internet is 100% secure, and we cannot
          guarantee absolute security.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">Third-Party Sharing</h2>
        <p>
          We do not sell your personal information. We may share data with trusted payment
          processors, analytics providers, and as required by law.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal data. You may also
          opt out of marketing communications at any time by contacting us.
        </p>
      </section>
    </div>
  );
}
