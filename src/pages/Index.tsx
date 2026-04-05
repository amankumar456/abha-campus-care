import { Link } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HealthCentreInfo from "@/components/HealthCentreInfo";
import SecurityBanner from "@/components/SecurityBanner";
import Footer from "@/components/Footer";
import BackgroundWrapper from "@/components/layout/BackgroundWrapper";
import HealthServicesSection from "@/components/HealthServicesSection";
import HospitalIntegration from "@/components/HospitalIntegration";
import WelcomeBanner from "@/components/WelcomeBanner";
import DisclaimerSection from "@/components/DisclaimerSection";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import DoctorHomeDashboard from "@/components/doctor/DoctorHomeDashboard";
import LabOfficerHomeDashboard from "@/components/lab/LabOfficerHomeDashboard";
import PharmacyHomeDashboard from "@/components/pharmacy/PharmacyHomeDashboard";
import StudentHomeDashboard from "@/components/student/StudentHomeDashboard";

const Index = () => {
  const { user, isDoctor, isStudent, isLabOfficer, isPharmacy, isMedicalStaff, isAdmin, isMentor, loading } = useUserRole();
  const navigate = useNavigate();

  // Redirect admin, mentor, and medical staff roles to their dedicated pages
  useEffect(() => {
    if (loading || !user) return;
    if (isAdmin) navigate('/admin', { replace: true });
    else if (isMentor) navigate('/mentor/home', { replace: true });
    else if (isMedicalStaff) navigate('/staff/home', { replace: true });
  }, [user, loading, isAdmin, isMentor, isMedicalStaff, navigate]);

  // Don't render landing page for redirecting roles
  if (user && (isAdmin || isMentor || isMedicalStaff)) {
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
        ) : isPharmacy && user ? (
          <PharmacyHomeDashboard />
        ) : isStudent && user ? (
          <StudentHomeDashboard />
        ) : user ? (
          // Logged in but no specific role yet — show student home as default
          <StudentHomeDashboard />
        ) : (
          <>
            <DisclaimerSection />
            <WelcomeBanner />
            <HeroSection />
            <InspirationalSection />
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
