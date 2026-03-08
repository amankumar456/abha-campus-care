import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

const BackNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isDoctor, isMentor, isAdmin, isLabOfficer, isPharmacy, isMedicalStaff } = useUserRole();

  // Hide on public pages when not logged in (landing, auth, email confirmation)
  const publicOnlyPages = ["/auth", "/email-confirmation"];
  if (!user && (location.pathname === "/" || publicOnlyPages.includes(location.pathname))) {
    return null;
  }

  const getHomePath = () => {
    if (isAdmin) return '/admin';
    if (isDoctor) return '/';
    if (isMentor) return '/mentor/home';
    if (isLabOfficer) return '/';
    if (isPharmacy) return '/';
    if (isMedicalStaff) return '/staff/home';
    return '/';
  };

  const homePath = getHomePath();

  // These are the "home" pages for each role — hide Back but show Home
  const homePages = ['/', '/mentor/home', '/admin', '/staff/home', '/admin/dashboard'];
  const isOnHomePage = homePages.includes(location.pathname) && location.pathname === homePath;

  // On the actual home page for the role, hide the entire bar
  if (isOnHomePage) return null;

  const handleBack = () => {
    // For staff roles, "Back" goes to their home to prevent landing on wrong page
    if (isLabOfficer || isPharmacy || isMedicalStaff || isAdmin) {
      navigate(homePath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="sticky top-[72px] z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-2 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(homePath)}
          className="text-primary hover:bg-primary/10"
        >
          <Home className="h-4 w-4 mr-1" />
          Home
        </Button>
      </div>
    </div>
  );
};

export default BackNavigation;
