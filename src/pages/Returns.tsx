import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/StaticPageLayout";
import { legal } from "@/config/legal";

const Returns = () => (
  <StaticPageLayout
    eyebrow="Support"
    title="Returns & Exchanges"
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
          <li>{legal.returnPolicy.nonDefectReturnsSummary}</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Damaged, Defective, or Incorrect Items
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>{legal.returnPolicy.defectIssueSummary}</li>
          <li>{legal.returnPolicy.claimDocumentationSummary}</li>
          <li>{legal.returnPolicy.approvedClaimsSummary}</li>
          <li>{legal.returnPolicy.noReturnRequiredSummary}</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Start A Request
        </h2>
        <p className="mt-3">
          Use the <Link className="text-foreground underline" to="/contact">Contact page</Link> and include your order ID, request type, and any relevant photos.
        </p>
      </section>
    </div>
  </StaticPageLayout>
);

export default Returns;
