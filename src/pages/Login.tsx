import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/components/auth/auth";
import { toast } from "@/components/ui/sonner";

const Login = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const lastLogin = useMemo(() => {
    if (!user?.lastLogin) return null;
    const date = new Date(user.lastLogin);
    return date.toLocaleString();
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus(null);

    const result = login(email, password);
    if (result.ok) {
      toast("Access granted. Welcome back.");
      setStatus("Authenticated.");
      navigate("/");
    } else {
      setStatus(result.error ?? "Login failed.");
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-2xl border bg-card p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.14),_transparent_70%)]" />
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Admin Gate
              </p>
              <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight">
                Operator Login
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Use your admin credentials to access order management and drop controls.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-background/40 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Status
                  </div>
                  <div className="mt-2 text-sm text-foreground">
                    {user ? "Secure channel online" : "Awaiting credentials"}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {lastLogin ? `Last login: ${lastLogin}` : "Last drop: 4h ago"}
                  </div>
                </div>
                <div className="rounded-lg border bg-background/40 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Access Level
                  </div>
                  <div className="mt-2 text-sm text-foreground">Founder / Ops</div>
                  <div className="mt-2 text-xs text-muted-foreground">2FA required</div>
                </div>
                <div className="rounded-lg border bg-background/40 p-4 sm:col-span-2">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Mission Brief
                  </div>
                  <div className="mt-2 text-sm text-foreground">
                    Monitor fulfillment, approve drops, and review spike alerts.
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="rounded-2xl border bg-card p-8">
            <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Credentials
            </div>

            {user ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border bg-background/40 p-4">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Logged in as
                  </div>
                  <div className="mt-2 text-sm text-foreground">{user.email}</div>
                </div>
                <button
                  className="w-full rounded-lg border border-foreground bg-foreground px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
                  onClick={() => {
                    logout();
                    toast("Logged out.");
                  }}
                >
                  Sign out
                </button>
                <Link
                  to="/"
                  className="block text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Back to store
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground">Password</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border bg-card"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember this device
                  </label>
                  <button
                    type="button"
                    className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Hide" : "Show"} Password
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg border border-foreground bg-foreground px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!email || !password || submitting}
                >
                  {submitting ? "Signing in..." : "Sign in"}
                </button>

                {status ? (
                  <div className="rounded-lg border px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    {status}
                  </div>
                ) : null}
              </form>
            )}

            <div className="mt-6 text-xs text-muted-foreground">
              <Link to="/">Back to store</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
