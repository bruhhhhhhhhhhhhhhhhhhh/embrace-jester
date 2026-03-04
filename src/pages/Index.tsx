import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import ReviewsSection from "@/components/ReviewsSection";
import Footer from "@/components/Footer";
import SocialProofStrip from "@/components/SocialProofStrip";
import NewReleasesSection from "@/components/NewReleasesSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main>
        <HeroSection />
        <SocialProofStrip />
        <NewReleasesSection />
        <ProductGrid />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
