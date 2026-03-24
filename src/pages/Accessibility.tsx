import StaticPageLayout from "@/components/StaticPageLayout";
import { formatLegalResponseWindow, legal } from "@/config/legal";

const Accessibility = () => (
  <StaticPageLayout
    eyebrow="Support"
    title="Accessibility"
    description="We are working to keep the storefront usable across keyboards, assistive technology, and a wide range of devices."
  >
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        <strong className="text-foreground">Last updated:</strong> {legal.lastUpdatedAccessibility}
      </p>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          Commitment
        </h2>
        <p className="mt-2">
          We want this storefront to be usable for as many people as possible. That includes people
          navigating by keyboard, screen reader, magnification tools, voice control, and other
          assistive technology.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          Ongoing Improvements
        </h2>
        <p className="mt-2">
          Accessibility work is ongoing. We review storefront interactions, text contrast, form
          controls, and navigation patterns as the site evolves.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          Report An Accessibility Issue
        </h2>
        <p className="mt-2">
          If you encounter an accessibility barrier, email{" "}
          <a className="text-foreground underline" href={`mailto:${legal.supportEmail}`}>
            {legal.supportEmail}
          </a>
          . Please include the page, device, browser, and a short description of the issue.
        </p>
        <p className="mt-2">
          Current support response window: {formatLegalResponseWindow(legal.supportResponseWindowBusinessDays)}.
        </p>
      </section>
    </div>
  </StaticPageLayout>
);

export default Accessibility;
