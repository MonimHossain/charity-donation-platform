export default function DisclaimerPage() {
  return (
    <div className="bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-4xl px-6 py-14">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-4 font-serif text-4xl font-bold text-foreground">Disclaimer</h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl space-y-4 px-6 py-12 text-sm leading-relaxed text-muted-foreground">
        <p>
          The information provided on this platform is for general informational purposes only.
          While we strive to keep the information up to date and accurate, we make no
          representations or warranties of any kind about the completeness, accuracy, reliability,
          or availability of the information.
        </p>
        <p>
          Any reliance you place on such information is strictly at your own risk. We shall not
          be liable for any loss or damage arising from the use of this platform.
        </p>
        <p>
          Through this platform, you may be able to link to other websites which are not under
          our control. We have no control over the nature, content, and availability of those
          sites. The inclusion of any links does not necessarily imply a recommendation or
          endorsement of the views expressed within them.
        </p>
        <p>
          Campaign information, progress updates, and impact reports are provided by the
          respective campaign organisers. While we verify campaigns to the best of our ability,
          we cannot guarantee the accuracy of all claims made by campaign creators.
        </p>
      </section>
    </div>
  );
}
