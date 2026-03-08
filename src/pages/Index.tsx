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
import { useUserRole } from "@/hooks/useUserRole";
import DoctorHomeDashboard from "@/components/doctor/DoctorHomeDashboard";

const Index = () => {
  const { user, isDoctor, loading } = useUserRole();

  return (
    <BackgroundWrapper>
      <Header />
      <main>
        {isDoctor && user ? (
          // Doctor-specific home page
          <DoctorHomeDashboard />
        ) : (
          // Default student/public home page
          <>
            <WelcomeBanner />
            <HeroSection />
            <InspirationalSection />
            <AppointmentDashboard />
            <HealthServicesSection />
            <FeaturesSection />
            <HospitalIntegration />
            <SecurityBanner />
            <HealthCentreInfo />
          </>
        )}
      </main>
      <Footer />
    </BackgroundWrapper>
  );
};

export default Index;
