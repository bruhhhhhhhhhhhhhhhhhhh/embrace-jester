import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/components/cart/cart";
import { AuthProvider } from "@/components/auth/auth";
import { CatalogProvider } from "@/components/catalog/catalog";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsLifecycle from "@/components/AnalyticsLifecycle";
import RouteLoader from "@/components/RouteLoader";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Shop = lazy(() => import("./pages/Shop"));
const Product = lazy(() => import("./pages/Product"));
const Search = lazy(() => import("./pages/Search"));
const Confirmation = lazy(() => import("./pages/Confirmation"));
const SizeGuide = lazy(() => import("./pages/SizeGuide"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const About = lazy(() => import("./pages/About"));
const Review = lazy(() => import("./pages/Review"));
const ConversionQA = lazy(() => import("./pages/ConversionQA"));
const ReviewModeration = lazy(() => import("./pages/ReviewModeration"));
const StripeWebhookQA = lazy(() => import("./pages/StripeWebhookQA"));

const App = () => {
  const showAdminRoutes =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN_ROUTES === "true";

  return (
    <AuthProvider>
      <CartProvider>
        <CatalogProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnalyticsLifecycle />
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/confirmation" element={<Confirmation />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/shop/:category" element={<Shop />} />
                  <Route path="/product/:id" element={<Product />} />
                  <Route path="/size-guide" element={<SizeGuide />} />
                  <Route path="/shipping" element={<Shipping />} />
                  <Route path="/returns" element={<Returns />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/cookies" element={<Cookies />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/review" element={<Review />} />
                  {showAdminRoutes ? (
                    <>
                      <Route path="/qa/conversion" element={<ConversionQA />} />
                      <Route path="/qa/reviews" element={<ReviewModeration />} />
                      <Route path="/qa/stripe-webhooks" element={<StripeWebhookQA />} />
                    </>
                  ) : null}
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CookieBanner />
            </BrowserRouter>
          </TooltipProvider>
        </CatalogProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
