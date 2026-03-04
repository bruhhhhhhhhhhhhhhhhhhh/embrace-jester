import { createRoot } from "react-dom/client";
import SocialManager from "@/pages/SocialManager";
import "@/index.css";
import ErrorBoundary from "@/components/ErrorBoundary";

createRoot(document.getElementById("social-root")!).render(
  <ErrorBoundary>
    <SocialManager />
  </ErrorBoundary>
);
