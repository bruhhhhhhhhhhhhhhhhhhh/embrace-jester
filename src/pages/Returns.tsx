import StaticPageLayout from "@/components/StaticPageLayout";
import { legal } from "@/config/legal";

const Returns = () => (
  <StaticPageLayout
    eyebrow="Support"
    title="Returns"
    description="This policy explains how damage, defect, and wrong-item claims are handled for made-to-order apparel."
  >
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        <strong className="text-foreground">Last updated:</strong> {legal.lastUpdatedReturns}
      </p>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Change Of Mind, Size, and Color
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>{legal.returnPolicy.sizeExchangeEligibilitySummary}</li>
          <li>{legal.returnPolicy.finalSaleSummary}</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Damaged, Defective, or Incorrect Items
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>{legal.returnPolicy.issueEligibilitySummary}</li>
          <li>{legal.returnPolicy.conditionSummary}</li>
          <li>{legal.returnPolicy.returnShippingSummary}</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Approved Resolution
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Approved claims are resolved with a replacement or reprint at no extra charge.</li>
          <li>No return is required for approved defect or wrong-item claims.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Start A Request
        </h2>
        <p className="mt-3">
          Email{" "}
          <a className="text-foreground underline" href={`mailto:${legal.supportEmail}`}>
            {legal.supportEmail}
          </a>
          {" "}with your order ID, request type, and any relevant photos.
        </p>
      </section>
    </div>
  </StaticPageLayout>
);

export default Returns;
