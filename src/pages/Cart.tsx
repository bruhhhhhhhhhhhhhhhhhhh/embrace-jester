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
  const optionButtonClass = (active: boolean) =>
    active
      ? "min-h-10 rounded-none border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-background"
      : "min-h-10 rounded-none border border-border bg-background px-3 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-foreground transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0";

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="border border-border bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Order Review
              </p>
              <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-[0.12em]">
                Cart
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Review items, adjust variants, continue to checkout.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span className="border border-border bg-background px-3 py-1">
                Items {count}
              </span>
              <span className="border border-border bg-background px-3 py-1">
                Subtotal {formatMoney(subtotal)}
              </span>
              <button
                className="rounded-none border border-border bg-background px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors duration-150 hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={clear}
                disabled={!items.length}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {!items.length ? (
          <div className="mt-8 border border-border bg-card p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Cart
            </p>
            <h2 className="mt-3 font-heading text-2xl font-bold uppercase tracking-[0.12em]">
              Cart Empty
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No items selected.
            </p>
            <Link
              className="mt-6 inline-flex items-center justify-center rounded-none border border-foreground bg-foreground px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-background transition-colors duration-150 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0"
              to="/shop"
            >
              View Collection
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="overflow-hidden border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Lines
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {count} items
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
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-none border bg-muted"
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
                              className="font-heading text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-150 hover:text-foreground focus-visible:text-foreground"
                            >
                              {item.name}
                            </Link>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {[item.size && `Size ${item.size}`, item.color && `Color ${item.color}`]
                                .filter(Boolean)
                                .join(" / ") || "Standard configuration"}
                            </div>
                            {(sizeOptions.length || colorOptions.length) ? (
                              <div className="mt-4 space-y-3">
                                {sizeOptions.length ? (
                                  <div>
                                    <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                                      Size
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {sizeOptions.map((size) => (
                                        <button
                                          key={size}
                                          type="button"
                                          className={optionButtonClass(size === item.size)}
                                          onClick={() =>
                                            updateVariant(item.variantKey, {
                                              size: size || undefined,
                                            })
                                          }
                                        >
                                          {size}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                {colorOptions.length ? (
                                  <div>
                                    <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                                      Color
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {colorOptions.map((color) => (
                                        <button
                                          key={color.name}
                                          type="button"
                                          className={optionButtonClass(color.name === item.color)}
                                          onClick={() =>
                                            updateVariant(item.variantKey, {
                                              color: color.name || undefined,
                                            })
                                          }
                                        >
                                          {color.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <div className="font-mono text-sm text-foreground">
                            {formatMoney(item.price * item.quantity)}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                            <span>Qty</span>
                            <div className="inline-flex items-center border border-border">
                              <button
                                type="button"
                                className="h-10 w-10 rounded-none border-r border-border bg-background text-foreground transition-colors duration-150 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0"
                                onClick={() => setQty(item.variantKey, Math.max(1, item.quantity - 1))}
                              >
                                -
                              </button>
                              <input
                                className="h-10 w-14 rounded-none border-0 bg-card text-center font-mono text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0"
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  setQty(item.variantKey, Math.max(1, Number(e.target.value) || 1))
                                }
                              />
                              <button
                                type="button"
                                className="h-10 w-10 rounded-none border-l border-border bg-background text-foreground transition-colors duration-150 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0"
                                onClick={() => setQty(item.variantKey, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <button
                            className="rounded-none border border-border px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors duration-150 hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0"
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
              <div className="border border-border bg-card p-6">
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
                    <span className="font-mono text-foreground">{formatMoney(subtotal)}</span>
                  </div>
                  <div className="border border-border bg-background p-3">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                      <span>Free shipping progress</span>
                      <span className="text-foreground">{freeShippingProgress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-none bg-border/70">
                      <div
                        className="h-full rounded-none bg-foreground transition-[width] duration-300"
                        style={{ width: `${freeShippingProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {freeShippingRemaining > 0
                        ? `Add ${formatMoney(freeShippingRemaining)} for free standard shipping.`
                        : "Free shipping applied."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-mono text-muted-foreground">Calculated</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground">Estimated total</span>
                    <span className="font-mono text-foreground">{formatMoney(subtotal)}</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="mt-5 block rounded-none border border-foreground bg-foreground px-4 py-3 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-background transition-colors duration-150 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0"
                >
                  Check Out
                </Link>

                <Link
                  to="/shop"
                  className="mt-3 block text-center text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0"
                >
                  View Collection
                </Link>

                <div className="mt-4 text-xs text-muted-foreground">
                  Shipping and totals update at checkout.
                </div>
              </div>

              <div className="border border-border bg-card p-6">
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Promo Code
                </div>
                <div className="mt-3 flex gap-3">
                  <input
                    className="flex-1 border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    placeholder="Enter code"
                  />
                  <button
                    className="rounded-none border border-border bg-background px-4 py-2 text-xs font-mono font-semibold uppercase tracking-[0.22em] text-muted-foreground opacity-60"
                    disabled
                  >
                    Apply
                  </button>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Promo codes apply after verification.
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
