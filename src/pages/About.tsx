import StaticPageLayout from "@/components/StaticPageLayout";

const About = () => (
  <StaticPageLayout
    eyebrow="Brand"
    title="About Embrace Jester"
    description="Embrace Jester is built around the dark essence of the jester: visible to everyone, understood by few. We design stark pieces for men who are done being overlooked."
  >
    <div className="space-y-6 text-sm text-muted-foreground">
      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-[0.08em] text-foreground">
          What We Build
        </h2>
        <p className="mt-2">
          Our catalog focuses on hard silhouettes, monochrome contrast, and clean geometry. Each drop
          is engineered to read sharp on-body and in motion.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-[0.08em] text-foreground">
          Drop Structure
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Limited runs move through the storefront in short cycles.</li>
          <li>Restocks and new acts are announced through newsletter and socials.</li>
          <li>Live catalog availability updates directly from fulfillment sync.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-[0.08em] text-foreground">
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
