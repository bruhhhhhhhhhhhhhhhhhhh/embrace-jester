import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NotificationBar from "@/components/NotificationBar";
import { apiFetch } from "@/lib/api";

type SocialPlatformMetrics = {
  impressions: number;
  views: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

type SocialPost = {
  id: string;
  title: string;
  caption: string;
  platforms: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor: string | null;
  publishedAt: string | null;
  assetUrl: string;
  voiceoverPrompt: string;
  source: "native" | "pipeline_manager";
  pipelineRef: string | null;
  metricsByPlatform: Record<string, SocialPlatformMetrics>;
  createdAt: string;
  updatedAt: string;
};

type SocialAccount = {
  id: string;
  platform: string;
  handle: string;
  status: "connected" | "needs_auth" | "error";
  followers: number;
  profileUrl: string;
  lastSyncAt: string | null;
};

type SocialAutomationConfig = {
  scriptProvider: "manual" | "scribe";
  videoProvider: "manual" | "sora" | "veo3";
  audioProvider: "manual" | "lipsync";
  autoPublish: boolean;
  defaultHashtags: string[];
};

type SocialMetrics = {
  summary: SocialPlatformMetrics & { engagementRate: number; ctr: number };
  platforms: Array<{
    platform: string;
    metrics: SocialPlatformMetrics & { engagementRate: number; ctr: number };
  }>;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
};

type SocialStateResponse = {
  accounts: SocialAccount[];
  posts: SocialPost[];
  automation: SocialAutomationConfig;
  metrics: SocialMetrics;
  updatedAt: string;
};

type SocialProviderResponse = {
  script: Array<{ id: string; label: string }>;
  video: Array<{ id: string; label: string }>;
  audio: Array<{ id: string; label: string }>;
};

type NewsletterSummaryResponse = {
  total: number;
  campaigns: Array<{
    id: string;
    subject: string;
    sentAt: string;
    recipients: number;
    provider: "resend" | "dry_run";
  }>;
};

const EMPTY_METRICS: SocialMetrics = {
  summary: {
    impressions: 0,
    views: 0,
    clicks: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    engagementRate: 0,
    ctr: 0,
  },
  platforms: [],
  publishedPosts: 0,
  scheduledPosts: 0,
  draftPosts: 0,
};

const toLocalInputValue = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const toIsoFromLocal = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const formatWhen = (value: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
};

const SocialManager = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socialState, setSocialState] = useState<SocialStateResponse | null>(null);
  const [providers, setProviders] = useState<SocialProviderResponse | null>(null);
  const [newsletterSummary, setNewsletterSummary] = useState<NewsletterSummaryResponse | null>(null);
  const [busyAction, setBusyAction] = useState("");
  const [feedback, setFeedback] = useState("");

  const [postForm, setPostForm] = useState({
    title: "",
    caption: "",
    platforms: "instagram,tiktok,youtube_shorts",
    assetUrl: "",
    voiceoverPrompt: "",
    scheduledFor: "",
  });

  const [automationForm, setAutomationForm] = useState<SocialAutomationConfig>({
    scriptProvider: "manual",
    videoProvider: "manual",
    audioProvider: "manual",
    autoPublish: false,
    defaultHashtags: ["#embracejester", "#jestermaxx", "#streetwear"],
  });

  const [newsletterForm, setNewsletterForm] = useState({
    subject: "New drop is live",
    headline: "New Embrace Jester drop is live",
    body: "Fresh monochrome drop is now live. Limited stock and fast turnover. Tap through to secure your size.",
    ctaUrl: "http://localhost:3030/shop",
    testEmail: "",
  });

  const loadState = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [social, providerList, newsletter] = await Promise.all([
        apiFetch<SocialStateResponse>("/api/social/state"),
        apiFetch<SocialProviderResponse>("/api/social/providers"),
        apiFetch<NewsletterSummaryResponse>("/api/newsletter/subscribers"),
      ]);
      setSocialState(social);
      setProviders(providerList);
      setNewsletterSummary(newsletter);
      setAutomationForm(social.automation);
    } catch (requestError) {
      setError((requestError as Error).message || "Failed to load social manager data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const sortedPosts = useMemo(() => {
    const items = socialState?.posts ?? [];
    return items
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [socialState?.posts]);

  const metrics = socialState?.metrics ?? EMPTY_METRICS;

  const updateAutomation = async () => {
    setBusyAction("automation");
    setFeedback("");
    try {
      await apiFetch<{ ok: true; automation: SocialAutomationConfig }>(
        "/api/social/automation/update",
        {
          method: "POST",
          body: JSON.stringify(automationForm),
        }
      );
      setFeedback("Automation settings saved.");
      await loadState();
    } catch (requestError) {
      setFeedback((requestError as Error).message || "Failed to update automation.");
    } finally {
      setBusyAction("");
    }
  };

  const savePost = async () => {
    const title = postForm.title.trim();
    if (!title) {
      setFeedback("Post title is required.");
      return;
    }

    setBusyAction("post");
    setFeedback("");
    try {
      const platforms = postForm.platforms
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
      const scheduledIso = toIsoFromLocal(postForm.scheduledFor);
      await apiFetch<{ ok: true; post: SocialPost }>("/api/social/posts/upsert", {
        method: "POST",
        body: JSON.stringify({
          title,
          caption: postForm.caption.trim(),
          platforms,
          status: scheduledIso ? "scheduled" : "draft",
          scheduledFor: scheduledIso,
          assetUrl: postForm.assetUrl.trim(),
          voiceoverPrompt: postForm.voiceoverPrompt.trim(),
          source: "native",
        }),
      });

      setPostForm({
        title: "",
        caption: "",
        platforms: postForm.platforms,
        assetUrl: "",
        voiceoverPrompt: "",
        scheduledFor: "",
      });
      setFeedback("Post saved.");
      await loadState();
    } catch (requestError) {
      setFeedback((requestError as Error).message || "Failed to save post.");
    } finally {
      setBusyAction("");
    }
  };

  const schedulePost = async (postId: string) => {
    setBusyAction(`schedule:${postId}`);
    setFeedback("");
    try {
      await apiFetch<{ ok: true; post: SocialPost }>(
        `/api/social/posts/${encodeURIComponent(postId)}/schedule`,
        {
          method: "POST",
          body: JSON.stringify({ scheduledFor: new Date(Date.now() + 30 * 60_000).toISOString() }),
        }
      );
      setFeedback("Post scheduled for 30 minutes from now.");
      await loadState();
    } catch (requestError) {
      setFeedback((requestError as Error).message || "Failed to schedule post.");
    } finally {
      setBusyAction("");
    }
  };

  const publishPost = async (postId: string) => {
    setBusyAction(`publish:${postId}`);
    setFeedback("");
    try {
      await apiFetch<{ ok: true; post: SocialPost }>(
        `/api/social/posts/${encodeURIComponent(postId)}/publish`,
        {
          method: "POST",
        }
      );
      setFeedback("Post published and metrics generated.");
      await loadState();
    } catch (requestError) {
      setFeedback((requestError as Error).message || "Failed to publish post.");
    } finally {
      setBusyAction("");
    }
  };

  const syncPipelineManager = async () => {
    setBusyAction("sync");
    setFeedback("");
    try {
      const response = await apiFetch<{
        ok: true;
        created: number;
        updated: number;
        warnings: string[];
      }>("/api/social/sync/pipelinemanager", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const warningText = response.warnings.length
        ? ` Warnings: ${response.warnings.join(" | ")}`
        : "";
      setFeedback(
        `PipelineManager sync complete. Created ${response.created}, updated ${response.updated}.${warningText}`
      );
      await loadState();
    } catch (requestError) {
      setFeedback((requestError as Error).message || "PipelineManager sync failed.");
    } finally {
      setBusyAction("");
    }
  };

  const sendNewsletterDrop = async () => {
    const subject = newsletterForm.subject.trim();
    const headline = newsletterForm.headline.trim();
    const body = newsletterForm.body.trim();
    if (!subject || !headline || !body) {
      setFeedback("Newsletter requires subject, headline, and body.");
      return;
    }

    setBusyAction("newsletter");
    setFeedback("");
    try {
      const response = await apiFetch<{
        ok: true;
        provider: "resend" | "dry_run";
        requestedRecipients: number;
        sent: number;
        errors: string[];
      }>("/api/newsletter/send-drop", {
        method: "POST",
        body: JSON.stringify({
          subject,
          headline,
          body,
          ctaUrl: newsletterForm.ctaUrl.trim() || undefined,
          testEmail: newsletterForm.testEmail.trim() || undefined,
        }),
      });
      const errorText = response.errors.length
        ? ` Errors: ${response.errors.join(" | ")}`
        : "";
      setFeedback(
        `Newsletter sent via ${response.provider}. ${response.sent}/${response.requestedRecipients} delivered.${errorText}`
      );
      await loadState();
    } catch (requestError) {
      setFeedback((requestError as Error).message || "Failed to send newsletter.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <section className="rounded-xl border border-border/70 bg-card/70 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Embrace Jester Internal
              </p>
              <h1 className="mt-2 font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
                Social Studio
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Plan drops, schedule shorts, sync with PipelineManager, and monitor content metrics in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => void loadState()}
                disabled={loading || Boolean(busyAction)}
                className="rounded-md border border-border/70 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground disabled:opacity-60"
              >
                Refresh
              </button>
              <button
                onClick={() => void syncPipelineManager()}
                disabled={loading || Boolean(busyAction)}
                className="rounded-md border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-60"
              >
                {busyAction === "sync" ? "Syncing..." : "Sync PipelineManager"}
              </button>
            </div>
          </div>

          {feedback ? (
            <p className="mt-4 rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
              {feedback}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <article className="rounded-lg border border-border/70 bg-card/70 p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Impressions</p>
            <p className="mt-2 font-mono text-2xl font-bold text-foreground">
              {metrics.summary.impressions.toLocaleString()}
            </p>
          </article>
          <article className="rounded-lg border border-border/70 bg-card/70 p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Views</p>
            <p className="mt-2 font-mono text-2xl font-bold text-foreground">
              {metrics.summary.views.toLocaleString()}
            </p>
          </article>
          <article className="rounded-lg border border-border/70 bg-card/70 p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Engagement</p>
            <p className="mt-2 font-mono text-2xl font-bold text-foreground">
              {(metrics.summary.engagementRate * 100).toFixed(2)}%
            </p>
          </article>
          <article className="rounded-lg border border-border/70 bg-card/70 p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">CTR</p>
            <p className="mt-2 font-mono text-2xl font-bold text-foreground">
              {(metrics.summary.ctr * 100).toFixed(2)}%
            </p>
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <article className="rounded-lg border border-border/70 bg-card/70 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wide">Scheduled + Published Posts</h2>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {metrics.publishedPosts} published / {metrics.scheduledPosts} scheduled / {metrics.draftPosts} drafts
              </p>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <th className="border-b border-border/70 px-2 py-2">Post</th>
                    <th className="border-b border-border/70 px-2 py-2">Platforms</th>
                    <th className="border-b border-border/70 px-2 py-2">Status</th>
                    <th className="border-b border-border/70 px-2 py-2">When</th>
                    <th className="border-b border-border/70 px-2 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPosts.length ? (
                    sortedPosts.map((post) => (
                      <tr key={post.id} className="text-xs text-foreground">
                        <td className="border-b border-border/50 px-2 py-3 align-top">
                          <p className="font-medium">{post.title}</p>
                          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                            {post.caption || "No caption"}
                          </p>
                        </td>
                        <td className="border-b border-border/50 px-2 py-3 align-top text-[11px] text-muted-foreground">
                          {post.platforms.join(", ")}
                        </td>
                        <td className="border-b border-border/50 px-2 py-3 align-top">
                          <span
                            className={`rounded-md border px-2 py-1 text-[10px] font-mono uppercase tracking-widest ${
                              post.status === "published"
                                ? "border-green-500/40 bg-green-500/10 text-green-300"
                                : post.status === "scheduled"
                                  ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                                  : post.status === "failed"
                                    ? "border-red-500/40 bg-red-500/10 text-red-300"
                                    : "border-border/70 bg-background/40 text-muted-foreground"
                            }`}
                          >
                            {post.status}
                          </span>
                        </td>
                        <td className="border-b border-border/50 px-2 py-3 align-top text-[11px] text-muted-foreground">
                          {post.status === "published"
                            ? formatWhen(post.publishedAt)
                            : formatWhen(post.scheduledFor)}
                        </td>
                        <td className="border-b border-border/50 px-2 py-3 align-top text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => void schedulePost(post.id)}
                              disabled={Boolean(busyAction)}
                              className="rounded-md border border-border/70 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground disabled:opacity-60"
                            >
                              {busyAction === `schedule:${post.id}` ? "..." : "Schedule"}
                            </button>
                            <button
                              onClick={() => void publishPost(post.id)}
                              disabled={Boolean(busyAction)}
                              className="rounded-md border border-foreground bg-foreground px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-60"
                            >
                              {busyAction === `publish:${post.id}` ? "..." : "Publish"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-2 py-8 text-center text-xs text-muted-foreground"
                      >
                        {loading ? "Loading posts..." : "No posts yet. Create one on the right panel."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <aside className="space-y-6">
            <article className="rounded-lg border border-border/70 bg-card/70 p-4">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wide">Create Post</h2>
              <div className="mt-3 space-y-3">
                <input
                  value={postForm.title}
                  onChange={(event) =>
                    setPostForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Post title"
                  className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <textarea
                  value={postForm.caption}
                  onChange={(event) =>
                    setPostForm((prev) => ({ ...prev, caption: event.target.value }))
                  }
                  rows={3}
                  placeholder="Caption"
                  className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <input
                  value={postForm.platforms}
                  onChange={(event) =>
                    setPostForm((prev) => ({ ...prev, platforms: event.target.value }))
                  }
                  placeholder="instagram,tiktok,youtube_shorts"
                  className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <input
                  value={postForm.assetUrl}
                  onChange={(event) =>
                    setPostForm((prev) => ({ ...prev, assetUrl: event.target.value }))
                  }
                  placeholder="Asset URL (optional)"
                  className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <input
                  value={postForm.voiceoverPrompt}
                  onChange={(event) =>
                    setPostForm((prev) => ({ ...prev, voiceoverPrompt: event.target.value }))
                  }
                  placeholder="Voiceover prompt (optional)"
                  className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <input
                  type="datetime-local"
                  value={postForm.scheduledFor}
                  onChange={(event) =>
                    setPostForm((prev) => ({ ...prev, scheduledFor: event.target.value }))
                  }
                  className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() => void savePost()}
                  disabled={Boolean(busyAction)}
                  className="w-full rounded-md border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-60"
                >
                  {busyAction === "post" ? "Saving..." : "Save Post"}
                </button>
              </div>
            </article>

            <article className="rounded-lg border border-border/70 bg-card/70 p-4">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wide">Automation</h2>
              <div className="mt-3 grid gap-3">
                <select
                  value={automationForm.scriptProvider}
                  onChange={(event) =>
                    setAutomationForm((prev) => ({
                      ...prev,
                      scriptProvider: event.target.value as SocialAutomationConfig["scriptProvider"],
                    }))
                  }
                  className="rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {(providers?.script ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      Script: {item.label}
                    </option>
                  ))}
                </select>
                <select
                  value={automationForm.videoProvider}
                  onChange={(event) =>
                    setAutomationForm((prev) => ({
                      ...prev,
                      videoProvider: event.target.value as SocialAutomationConfig["videoProvider"],
                    }))
                  }
                  className="rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {(providers?.video ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      Video: {item.label}
                    </option>
                  ))}
                </select>
                <select
                  value={automationForm.audioProvider}
                  onChange={(event) =>
                    setAutomationForm((prev) => ({
                      ...prev,
                      audioProvider: event.target.value as SocialAutomationConfig["audioProvider"],
                    }))
                  }
                  className="rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {(providers?.audio ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      Audio: {item.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={automationForm.autoPublish}
                    onChange={(event) =>
                      setAutomationForm((prev) => ({
                        ...prev,
                        autoPublish: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border/70 bg-background/40"
                  />
                  Auto publish after render completes
                </label>
                <input
                  value={automationForm.defaultHashtags.join(", ")}
                  onChange={(event) =>
                    setAutomationForm((prev) => ({
                      ...prev,
                      defaultHashtags: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() => void updateAutomation()}
                  disabled={Boolean(busyAction)}
                  className="rounded-md border border-border/70 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground disabled:opacity-60"
                >
                  {busyAction === "automation" ? "Saving..." : "Save Automation"}
                </button>
              </div>
            </article>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <article className="rounded-lg border border-border/70 bg-card/70 p-4">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wide">Connected Accounts</h2>
            <ul className="mt-3 space-y-3">
              {(socialState?.accounts ?? []).map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-background/30 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">{account.platform}</p>
                    <p className="text-[11px] text-muted-foreground">{account.handle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-foreground">{account.followers.toLocaleString()} followers</p>
                    <p className="text-[11px] text-muted-foreground">{account.status}</p>
                  </div>
                </li>
              ))}
              {!socialState?.accounts?.length ? (
                <li className="text-xs text-muted-foreground">No accounts yet.</li>
              ) : null}
            </ul>
          </article>

          <article className="rounded-lg border border-border/70 bg-card/70 p-4">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wide">Drop Newsletter</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Subscribers: {(newsletterSummary?.total ?? 0).toLocaleString()}
            </p>
            <div className="mt-3 space-y-3">
              <input
                value={newsletterForm.subject}
                onChange={(event) =>
                  setNewsletterForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="Subject"
                className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <input
                value={newsletterForm.headline}
                onChange={(event) =>
                  setNewsletterForm((prev) => ({ ...prev, headline: event.target.value }))
                }
                placeholder="Headline"
                className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <textarea
                value={newsletterForm.body}
                onChange={(event) =>
                  setNewsletterForm((prev) => ({ ...prev, body: event.target.value }))
                }
                rows={4}
                placeholder="Body copy"
                className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <input
                value={newsletterForm.ctaUrl}
                onChange={(event) =>
                  setNewsletterForm((prev) => ({ ...prev, ctaUrl: event.target.value }))
                }
                placeholder="CTA URL"
                className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <input
                value={newsletterForm.testEmail}
                onChange={(event) =>
                  setNewsletterForm((prev) => ({ ...prev, testEmail: event.target.value }))
                }
                placeholder="Optional test email"
                className="w-full rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => void sendNewsletterDrop()}
                disabled={Boolean(busyAction)}
                className="w-full rounded-md border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-60"
              >
                {busyAction === "newsletter" ? "Sending..." : "Send Drop Newsletter"}
              </button>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-lg border border-border/70 bg-card/70 p-4">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide">Platform Breakdown</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {metrics.platforms.length ? (
              metrics.platforms.map((platform) => (
                <article
                  key={platform.platform}
                  className="rounded-md border border-border/60 bg-background/30 p-3"
                >
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {platform.platform}
                  </p>
                  <p className="mt-2 text-lg font-bold text-foreground">
                    {platform.metrics.impressions.toLocaleString()} impressions
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    CTR {(platform.metrics.ctr * 100).toFixed(2)}% • ENG{" "}
                    {(platform.metrics.engagementRate * 100).toFixed(2)}%
                  </p>
                </article>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No published metrics yet.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SocialManager;
