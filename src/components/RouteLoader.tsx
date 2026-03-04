import { useEffect, useState } from "react";

const LOAD_STEPS = [
  "Syncing catalog threads",
  "Calibrating black/white variants",
  "Securing checkout channel",
  "Finalizing storefront",
];
const RING_THICKNESS_PX = 7;
const TIP_SIZE_PX = 7.6;
const TIP_OFFSET_X_PX = 20.8;
const TIP_OFFSET_Y_PX = 12.0;

type RouteLoaderProps = {
  fullscreen?: boolean;
  className?: string;
  stepIntervalMs?: number;
  spinDurationMs?: number;
};

const RouteLoader = ({
  fullscreen = true,
  className = "",
  stepIntervalMs = 1200,
  spinDurationMs = 2400,
}: RouteLoaderProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const ringMask = `radial-gradient(farthest-side, transparent calc(100% - ${RING_THICKNESS_PX + 1}px), #000 calc(100% - ${RING_THICKNESS_PX}px))`;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOAD_STEPS.length);
    }, Math.max(400, stepIntervalMs));

    return () => window.clearInterval(interval);
  }, [stepIntervalMs]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-background px-4 ${
        fullscreen ? "min-h-screen" : "min-h-[620px] h-full rounded-2xl"
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.12),transparent_50%)]" />

      <div className="relative w-full max-w-xs rounded-xl border border-border/70 bg-card/85 px-6 py-7 shadow-elev-2 backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center">
          <div className="relative h-full w-full overflow-hidden rounded-full" aria-hidden="true">
            <div
              className="absolute inset-0"
              style={{
                animation: `loaderRotateSmooth ${Math.max(1200, spinDurationMs)}ms cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite`,
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "conic-gradient(from -120deg, #bbbbbb 0deg, #e7e7e7 90deg, #ffffff 180deg, #3e3e3e 180deg, #161616 270deg, #000000 360deg)",
                  WebkitMask: ringMask,
                  mask: ringMask,
                }}
              />
              <span
                className="absolute rounded-full"
                style={{
                  width: `${TIP_SIZE_PX}px`,
                  height: `${TIP_SIZE_PX}px`,
                  left: `calc(50% + ${TIP_OFFSET_X_PX}px)`,
                  top: `calc(50% - ${TIP_OFFSET_Y_PX}px)`,
                  transform: "translate(-50%, -50%)",
                  background:
                    "radial-gradient(circle at 74% 26%, #ffffff 0%, #ffffff 48%, #f3f3f3 68%, rgba(231,231,231,0.42) 84%, rgba(231,231,231,0) 100%)",
                }}
              />
              <span
                className="absolute rounded-full"
                style={{
                  width: `${TIP_SIZE_PX}px`,
                  height: `${TIP_SIZE_PX}px`,
                  left: `calc(50% - ${TIP_OFFSET_X_PX}px)`,
                  top: `calc(50% + ${TIP_OFFSET_Y_PX}px)`,
                  transform: "translate(-50%, -50%)",
                  background:
                    "radial-gradient(circle at 26% 74%, #000000 0%, #000000 48%, #111111 68%, rgba(40,40,40,0.46) 84%, rgba(40,40,40,0) 100%)",
                }}
              />
            </div>
          </div>
        </div>

        <p className="mt-4 text-center font-heading text-xs font-bold uppercase tracking-[0.2em] text-foreground">
          Loading
        </p>
        <p className="mt-1.5 text-center text-[9px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
          {LOAD_STEPS[stepIndex]}
        </p>
      </div>
    </div>
  );
};

export default RouteLoader;
