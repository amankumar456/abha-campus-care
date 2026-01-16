import EmergencyBar from "@/components/EmergencyBar";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import QuickAccessSection from "@/components/QuickAccessSection";
import HealthCentreInfo from "@/components/HealthCentreInfo";
import SecurityBanner from "@/components/SecurityBanner";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <EmergencyBar />
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <QuickAccessSection />
        <SecurityBanner />
        <HealthCentreInfo />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
