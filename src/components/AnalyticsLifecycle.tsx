import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  attachConsentAnalyticsListener,
  initializeAnalytics,
  trackPageView,
} from "@/lib/analytics";

const AnalyticsLifecycle = () => {
  const location = useLocation();

  useEffect(() => {
    initializeAnalytics();
    const detach = attachConsentAnalyticsListener();
    return () => {
      detach();
    };
  }, []);

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(path);
  }, [location.hash, location.pathname, location.search]);

  return null;
};

export default AnalyticsLifecycle;
