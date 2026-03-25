import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import StaticPageLayout from "@/components/StaticPageLayout";
import { legal } from "@/config/legal";
import { apiFetch } from "@/lib/api";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const Unsubscribe = () => {
  const location = useLocation();
  const initialEmail = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("email") ?? "").trim().toLowerCase();
  }, [location.search]);

  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setStatus("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    try {
      await apiFetch<{ ok: boolean; subscribers: number }>("/api/newsletter/unsubscribe", {
        method: "POST",
        body: JSON.stringify({ email: normalized }),
      });
      setStatus("You are unsubscribed from marketing emails.");
    } catch (error) {
      setStatus((error as Error).message || "Unsubscribe failed. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StaticPageLayout
      eyebrow="Email Preferences"
      title="Unsubscribe"
      description="You can opt out of marketing emails at any time. Transactional order updates will still be sent when required."
    >
      <form className="max-w-xl space-y-4" onSubmit={handleSubmit}>
        <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full border border-border/70 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          placeholder="you@example.com"
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={submitting}
          className="border border-foreground bg-foreground px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Unsubscribe"}
        </button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          We use your email to send store updates and marketing emails. You can unsubscribe at any
          time. Designated marketing sender: {legal.marketingSenderName} via {legal.marketingFromEmail}.
        </p>
        {!legal.supportInboxOperational ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Mailbox activation is still in progress. Confirm delivery before public launch.
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            If you still receive promotional emails after opting out, contact{" "}
            <a className="text-foreground underline" href={`mailto:${legal.supportEmail}`}>
              {legal.supportEmail}
            </a>
            .
          </p>
        )}
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </form>
    </StaticPageLayout>
  );
};

export default Unsubscribe;
