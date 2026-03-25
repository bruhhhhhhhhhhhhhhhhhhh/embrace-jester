import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/StaticPageLayout";
import { legal } from "@/config/legal";

const ReviewPolicy = () => (
  <StaticPageLayout
    eyebrow="Legal"
    title="Review Policy"
    description="This policy explains what may be submitted, how reviews are moderated, and how review-related questions are handled."
  >
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        <strong className="text-foreground">Last updated:</strong> {legal.lastUpdatedReviewPolicy}
      </p>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          1. What You May Submit
        </h2>
        <p className="mt-2">
          Reviews should reflect your own experience with the product, order, or service. You may
          submit ratings, written comments, and any media the review flow allows.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          2. Moderation Standards
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>We may reject or remove spam, abuse, harassment, impersonation, or illegal content.</li>
          <li>We may reject irrelevant content, manipulated media, or duplicated submissions.</li>
          <li>We may remove content that discloses sensitive personal information.</li>
          <li>Truthful negative reviews are not removed only because they are negative.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          3. Incentives and Disclosure
        </h2>
        <p className="mt-2">
          If a review is ever connected to an incentive, discount, or free product, that relationship
          must be disclosed clearly. Undisclosed incentivized reviews are not permitted.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          4. Editing and Removal
        </h2>
        <p className="mt-2">
          We may make limited edits for formatting, length, or privacy protection without changing
          the substance of a review. Reviews may also be removed for policy violations.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          5. Questions or Disputes
        </h2>
        <p className="mt-2">
          For questions about a review or moderation decision, use the designated review contact at{" "}
          {legal.supportInboxOperational ? (
            <a className="text-foreground underline" href={`mailto:${legal.reviewContactEmail}`}>
              {legal.reviewContactEmail}
            </a>
          ) : (
            <span className="text-foreground">{legal.reviewContactEmail}</span>
          )}
          . See also our <Link className="text-foreground underline" to="/privacy">Privacy Policy</Link> and{" "}
          <Link className="text-foreground underline" to="/contact">Contact</Link>.
        </p>
        {!legal.supportInboxOperational ? (
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Mailbox activation is in progress. Confirm inbox delivery before launch.
          </p>
        ) : null}
      </section>
    </div>
  </StaticPageLayout>
);

export default ReviewPolicy;
