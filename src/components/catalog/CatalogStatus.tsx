import { useMemo } from "react";
import { useCatalog } from "@/components/catalog/catalog";

const CatalogStatus = ({ className = "" }: { className?: string }) => {
  const { source, refreshedAt, syncing, refresh } = useCatalog();
  const showStatusBar =
    import.meta.env.DEV || import.meta.env.VITE_SHOW_CATALOG_STATUS === "true";
  const showManualSync =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_MANUAL_CATALOG_SYNC === "true";

  const lastSyncLabel = useMemo(() => {
    if (!refreshedAt) return "Not synced yet";
    try {
      return new Date(refreshedAt).toLocaleString();
    } catch {
      return refreshedAt;
    }
  }, [refreshedAt]);

  if (!showStatusBar) return null;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground ${className}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <span className="inline-flex items-center gap-2 text-foreground">
          <span className="h-2 w-2 border border-border bg-foreground" />
          {source === "printify" ? "Catalog Live" : "Catalog Preview"}
        </span>
        <span>Updated: {lastSyncLabel}</span>
      </div>
      {showManualSync ? (
        <button
          type="button"
          onClick={refresh}
          disabled={syncing}
          className="border-b border-transparent text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          title="Manual collection refresh"
        >
          {syncing ? "Syncing..." : "Refresh Catalog"}
        </button>
      ) : null}
    </div>
  );
};

export default CatalogStatus;
