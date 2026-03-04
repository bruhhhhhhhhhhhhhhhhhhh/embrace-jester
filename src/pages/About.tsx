import StaticPageLayout from "@/components/StaticPageLayout";

const About = () => (
  <StaticPageLayout
    eyebrow="Brand"
    title="About Looksmax"
    description="Looksmax Store focuses on clean silhouettes, practical construction, and limited release cadence. We prioritize product clarity over hype."
  >
    <div className="space-y-6 text-sm text-muted-foreground">
      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          What We Build
        </h2>
        <p className="mt-2">
          We ship streetwear essentials with a strong shape language: heavyweight tops, structured
          bottoms, and focused colorways you can rotate daily.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          How Drops Work
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>New releases are published in limited batches.</li>
          <li>Restocks are announced through the newsletter and social channels.</li>
          <li>Catalog updates are reflected live in the shop.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          Contact
        </h2>
        <p className="mt-2">
          For support, partnerships, or creator collabs, use the{" "}
          <a className="text-foreground underline" href="/contact">
            contact page
          </a>
          .
        </p>
      </section>
    </div>
  </StaticPageLayout>
);

export default About;
