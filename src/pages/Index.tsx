import EmergencyBar from "@/components/EmergencyBar";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import QuickAccessSection from "@/components/QuickAccessSection";
import HealthCentreInfo from "@/components/HealthCentreInfo";
import SecurityBanner from "@/components/SecurityBanner";
import Footer from "@/components/Footer";
import BackgroundWrapper from "@/components/layout/BackgroundWrapper";
import AppointmentDashboard from "@/components/appointments/AppointmentDashboard";

const Index = () => {
  return (
    <BackgroundWrapper>
      <EmergencyBar />
      <Header />
      <main>
        <HeroSection />
        <AppointmentDashboard />
        <FeaturesSection />
        <QuickAccessSection />
        <SecurityBanner />
        <HealthCentreInfo />
      </main>
      <Footer />
    </BackgroundWrapper>
  );
};

export default Index;
