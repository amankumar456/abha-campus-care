import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundWrapper from "@/components/layout/BackgroundWrapper";
import AdminHomeDashboard from "@/components/admin/AdminHomeDashboard";

const AdminHome = () => {
  return (
    <BackgroundWrapper>
      <Header />
      <main>
        <AdminHomeDashboard />
      </main>
      <Footer />
    </BackgroundWrapper>
  );
};

export default AdminHome;
