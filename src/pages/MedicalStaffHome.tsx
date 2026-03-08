import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundWrapper from "@/components/layout/BackgroundWrapper";
import MedicalStaffHomeDashboard from "@/components/staff/MedicalStaffHomeDashboard";

const MedicalStaffHome = () => {
  return (
    <BackgroundWrapper>
      <Header />
      <main>
        <MedicalStaffHomeDashboard />
      </main>
      <Footer />
    </BackgroundWrapper>
  );
};

export default MedicalStaffHome;
