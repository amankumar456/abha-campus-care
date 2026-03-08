import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import InspirationalSection from "@/components/InspirationalSection";
import FeaturesSection from "@/components/FeaturesSection";

import HealthCentreInfo from "@/components/HealthCentreInfo";
import SecurityBanner from "@/components/SecurityBanner";
import Footer from "@/components/Footer";
import BackgroundWrapper from "@/components/layout/BackgroundWrapper";
import AppointmentDashboard from "@/components/appointments/AppointmentDashboard";
import HealthServicesSection from "@/components/HealthServicesSection";
import HospitalIntegration from "@/components/HospitalIntegration";
import WelcomeBanner from "@/components/WelcomeBanner";

const Index = () => {
  return (
    <BackgroundWrapper>
      <Header />
      <main>
        <WelcomeBanner />
        <HeroSection />
        <InspirationalSection />
        <AppointmentDashboard />
        <HealthServicesSection />
        <FeaturesSection />
        <HospitalIntegration />
        <QuickAccessSection />
        <SecurityBanner />
        <HealthCentreInfo />
      </main>
      <Footer />
    </BackgroundWrapper>
  );
};

export default Index;
