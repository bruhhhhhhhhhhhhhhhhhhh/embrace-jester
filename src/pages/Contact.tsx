import StaticPageLayout from "@/components/StaticPageLayout";

const SUPPORT_EMAIL = "support@looksmax.store";

const Contact = () => (
  <StaticPageLayout
    eyebrow="Support"
    title="Contact"
    description="Use these channels for order support, fit questions, partnership requests, or wholesale inquiries."
  >
    <div className="space-y-6 text-sm text-muted-foreground">
      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Customer Support
        </h2>
        <p className="mt-2">
          Email{" "}
          <a className="text-foreground underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>{" "}
          with your order ID and details.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Response Times
        </h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Order support: usually within 1 business day</li>
          <li>Partnerships and creator collabs: usually within 2-3 business days</li>
          <li>Bulk or wholesale requests: usually within 3 business days</li>
        </ul>
      </section>

      <p className="rounded-lg border border-border/60 bg-background/40 p-3 text-xs uppercase tracking-widest">
        Please include screenshots/photos for damaged item claims to speed up resolution.
      </p>
    </div>
  </StaticPageLayout>
);

export default Contact;
