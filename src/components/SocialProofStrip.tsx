import { ShieldCheck, Truck, Users } from "lucide-react";
import { useCatalog } from "@/components/catalog/catalog";

const SocialProofStrip = () => {
  const { products } = useCatalog();
  const totalColorways = products.reduce((sum, product) => sum + (product.colors?.length ?? 0), 0);

  const metrics = [
    {
      id: "catalog",
      icon: Users,
      label: "Collection",
      value: `${products.length} products`,
      note: `${totalColorways} color options across the current drop`,
    },
    {
      id: "shipping",
      icon: Truck,
      label: "Fulfillment",
      value: "Made to order",
      note: "Production and shipping estimates shown at checkout",
    },
    {
      id: "returns",
      icon: ShieldCheck,
      label: "Secure checkout",
      value: "Stripe protected",
      note: "14-day size exchange support",
    },
  ];

  return (
    <section className="border-y border-border/70 bg-surface-1">
      <div className="container mx-auto grid gap-3 px-4 py-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.id}
              className="flex items-center gap-3 rounded-ui-md border border-border/60 bg-surface-2 px-4 py-3 shadow-elev-1"
            >
              <div className="rounded-full border border-border/70 bg-background/60 p-2 text-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-token-label text-muted-foreground">
                  {metric.label}
                </p>
                <p className="font-heading text-sm font-bold uppercase tracking-tight text-foreground">
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
