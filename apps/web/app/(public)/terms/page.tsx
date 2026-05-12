export default function TermsPage() {
  return (
    <div className="bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-4xl px-6 py-14">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-4 font-serif text-4xl font-bold text-foreground">Terms &amp; Conditions</h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl space-y-4 px-6 py-12 text-sm leading-relaxed text-muted-foreground">
        <p>
          By accessing and using this platform, you agree to be bound by these Terms and Conditions.
          If you do not agree with any part of these terms, please do not use our services.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">Use of Service</h2>
        <p>
          This platform is provided for charitable donation purposes. You agree to use it only for
          lawful purposes and in accordance with these terms. You must not use the platform in any
          way that could damage, disable, or impair the service.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">Donations</h2>
        <p>
          All donations made through this platform are voluntary. We make every effort to ensure
          donations are directed to their intended campaigns. Refund policies may vary depending on
          the payment method and campaign status.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">Intellectual Property</h2>
        <p>
          All content on this platform, including text, graphics, logos, and software, is the
          property of the Charity Donation Platform or its licensors and is protected by applicable
          intellectual property laws.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, we shall not be liable for any indirect,
          incidental, or consequential damages arising from your use of this platform.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-foreground">Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. Changes will be effective
          immediately upon posting. Your continued use of the platform constitutes acceptance of the
          modified terms.
        </p>
      </section>
    </div>
  );
}
