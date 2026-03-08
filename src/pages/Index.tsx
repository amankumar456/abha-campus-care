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
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import DoctorHomeDashboard from "@/components/doctor/DoctorHomeDashboard";
import LabOfficerHomeDashboard from "@/components/lab/LabOfficerHomeDashboard";

const Index = () => {
  const { user, isDoctor, isLabOfficer, isPharmacy, isMedicalStaff, isAdmin, isMentor, loading } = useUserRole();
  const navigate = useNavigate();

  // Redirect staff roles (except lab officer) to their dedicated dashboards
  useEffect(() => {
    if (loading || !user) return;
    if (isPharmacy) navigate('/pharmacy/dashboard', { replace: true });
    else if (isMedicalStaff) navigate('/staff/dashboard', { replace: true });
    else if (isAdmin) navigate('/admin', { replace: true });
    else if (isMentor) navigate('/mentor/dashboard', { replace: true });
  }, [user, loading, isPharmacy, isMedicalStaff, isAdmin, isMentor, navigate]);

  // Don't render landing page for redirecting staff roles
  if (user && (isPharmacy || isMedicalStaff || isAdmin || isMentor)) {
    return null;
  }

  return (
    <BackgroundWrapper>
      <Header />
      <main>
        {isDoctor && user ? (
          <DoctorHomeDashboard />
        ) : isLabOfficer && user ? (
          <LabOfficerHomeDashboard />
        ) : (
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
