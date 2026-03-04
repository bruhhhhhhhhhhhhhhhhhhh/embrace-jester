import { ShieldCheck, Truck, Users } from "lucide-react";
import { useCatalog } from "@/components/catalog/catalog";

const SocialProofStrip = () => {
  const { products } = useCatalog();
  const totalColorways = products.reduce((sum, product) => sum + (product.colors?.length ?? 0), 0);

  const metrics = [
    {
      id: "catalog",
      icon: Users,
      label: "Catalog",
      value: `${products.length} products`,
      note: `${totalColorways} colorways in active rotation`,
    },
    {
      id: "shipping",
      icon: Truck,
      label: "Fulfillment",
      value: "Made To Order",
      note: "Production and shipping ETA shown at checkout",
    },
    {
      id: "returns",
      icon: ShieldCheck,
      label: "Checkout",
      value: "Stripe Secured",
      note: "Protected payment and 14-day size exchange support",
    },
  ];

  return (
    <section className="border-y border-border bg-surface-1">
      <div className="container mx-auto grid gap-3 px-4 py-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.id}
              className="flex items-center gap-3 border border-border bg-surface-2 px-4 py-3 shadow-sm"
            >
              <div className="border border-border bg-background p-2 text-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-token-label text-muted-foreground">
                  {metric.label}
                </p>
                <p className="font-heading text-sm font-bold uppercase tracking-[0.08em] text-foreground">
                  {metric.value}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-token-label text-muted-foreground">
                  {metric.note}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SocialProofStrip;
