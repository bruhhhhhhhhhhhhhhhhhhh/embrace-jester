import { Link } from "react-router-dom";
import { useCart } from "@/components/cart/cart";
import { formatMoney } from "@/lib/money";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCatalog } from "@/components/catalog/catalog";

const Cart = () => {
  const { items, count, subtotal, remove, setQty, updateVariant, clear } = useCart();
  const { products } = useCatalog();
  const freeShippingThreshold = 100;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_65%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Cart Thread
              </p>
              <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight">
                Secure Your Haul
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Review your picks, confirm fit variants, and finish checkout in one secure flow.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span className="rounded-md border bg-background/40 px-3 py-1">
                Items {count}
              </span>
              <span className="rounded-md border bg-background/40 px-3 py-1">
                Subtotal {formatMoney(subtotal)}
              </span>
              <button
                className="rounded-md border bg-background/40 px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                onClick={clear}
                disabled={!items.length}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>

        {!items.length ? (
          <div className="mt-8 rounded-2xl border bg-card p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              No Items Tracked
            </p>
            <h2 className="mt-3 font-heading text-2xl font-bold uppercase">Cart Empty</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse the latest drops and lock in your next upgrade.
            </p>
            <Link
              className="mt-6 inline-flex items-center justify-center rounded-lg border border-foreground bg-foreground px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
              to="/"
            >
              Back to Shop
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="flex items-center justify-between border-b bg-secondary px-6 py-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Active Cart Items
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {count} Pieces
                </span>
              </div>
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const product = products.find(
                    (p) => p.id === item.id || p.aliases?.includes(item.id)
                  );
                  const sizeOptions = product?.sizes ?? [];
                  const colorOptions = product?.colors ?? [];
                  const productLink = `/product/${item.id}`;

                  return (
                    <div
                      key={item.variantKey}
                      className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
                    >
                      <Link
                        to={productLink}
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <Link
                              to={productLink}
                              className="font-heading text-sm font-bold uppercase tracking-wide transition-colors hover:text-primary"
                            >
                              {item.name}
                            </Link>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {[item.size && `Size ${item.size}`, item.color && `Color ${item.color}`]
                                .filter(Boolean)
                                .join(" · ") || "Standard issue"}
                            </div>
                            {(sizeOptions.length || colorOptions.length) ? (
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                {sizeOptions.length ? (
                                  <label className="flex items-center gap-2">
                                    size
                                    <select
                                      className="rounded-md border bg-card px-2 py-1 text-[10px]"
                                      value={item.size ?? ""}
                                      onChange={(e) =>
                                        updateVariant(item.variantKey, {
                                          size: e.target.value || undefined,
                                        })
                                      }
                                    >
                                      {!item.size ? (
                                        <option value="">Select size</option>
                                      ) : null}
                                      {sizeOptions.map((size) => (
                                        <option key={size} value={size}>
                                          {size}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                ) : null}
                                {colorOptions.length ? (
                                  <label className="flex items-center gap-2">
                                    color
                                    <select
                                      className="rounded-md border bg-card px-2 py-1 text-[10px]"
                                      value={item.color ?? ""}
                                      onChange={(e) =>
                                        updateVariant(item.variantKey, {
                                          color: e.target.value || undefined,
                                        })
                                      }
                                    >
                                      {!item.color ? (
                                        <option value="">Select color</option>
                                      ) : null}
                                      {colorOptions.map((color) => (
                                        <option key={color.name} value={color.name}>
                                          {color.name}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                ) : null}
                              </div>
                            ) : null}
                            <div className="mt-3 inline-flex items-center gap-2 rounded-md border bg-background/40 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              Hold Active
                            </div>
                          </div>
                          <div className="font-mono text-sm text-forum-gold">
                            {formatMoney(item.price * item.quantity)}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                            qty
                            <input
                              className="w-20 rounded-lg border bg-card px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                setQty(item.variantKey, Math.max(1, Number(e.target.value) || 1))
                              }
                            />
                          </label>
                          <button
                            className="text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() => remove(item.variantKey)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-6">
                <div className="flex items-center justify-between">
                  <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Order Summary
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {count} items
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono text-forum-gold">{formatMoney(subtotal)}</span>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                      <span>Free shipping progress</span>
                      <span className="text-foreground">{freeShippingProgress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/70">
                      <div
                        className="h-full rounded-full bg-forum-gold transition-[width] duration-300"
                        style={{ width: `${freeShippingProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {freeShippingRemaining > 0
                        ? `Add ${formatMoney(freeShippingRemaining)} for free standard shipping.`
                        : "Free shipping unlocked."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-mono text-muted-foreground">Calculated</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground">Estimated total</span>
                    <span className="font-mono text-forum-gold">{formatMoney(subtotal)}</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="mt-5 block text-center rounded-lg border border-foreground bg-foreground px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  to="/"
                  className="mt-3 block text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Continue Shopping
                </Link>

                <div className="mt-4 text-xs text-muted-foreground">
                  Checkout supports Stripe payment methods and real-time shipping + tax estimates.
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-6">
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Promo Access
                </div>
                <div className="mt-3 flex gap-3">
                  <input
                    className="flex-1 rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="FORUMDROP"
                  />
                  <button
                    className="rounded-lg border border-foreground bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-widest text-background opacity-60"
                    disabled
                  >
                    Apply
                  </button>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Locked to verified accounts. Drops publish in waves.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
