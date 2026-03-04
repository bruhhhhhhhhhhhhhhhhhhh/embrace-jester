import StaticPageLayout from "@/components/StaticPageLayout";

const SizeGuide = () => (
  <StaticPageLayout
    eyebrow="Support"
    title="Size Guide"
    description="Use these fit standards before you purchase. Specific supplier measurements are shown directly on each product page when available."
  >
    <div className="space-y-6 text-sm text-muted-foreground">
      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          How To Measure
        </h2>
        <ol className="mt-3 space-y-2 list-decimal pl-5">
          <li>Chest: Measure around the fullest part of your chest.</li>
          <li>Length: Measure from top shoulder to hem.</li>
          <li>Waist: Measure around your natural waistline.</li>
          <li>Inseam: Measure from inner thigh to ankle.</li>
        </ol>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Fit Direction
        </h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Tees are a relaxed streetwear fit.</li>
          <li>If between sizes, size up for a looser drape.</li>
          <li>For a cleaner silhouette, choose your regular size.</li>
        </ul>
      </section>

      <p className="rounded-lg border border-border/60 bg-background/40 p-3 text-xs uppercase tracking-widest">
        Need sizing help for a specific item? Use the contact form and include product name + usual size.
      </p>
    </div>
  </StaticPageLayout>
);

export default SizeGuide;
