import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

const BackNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDoctor, isMentor, isAdmin, isLabOfficer, isPharmacy, isMedicalStaff } = useUserRole();

  if (location.pathname === "/") return null;

  const getHomePath = () => {
    if (isAdmin) return '/admin';
    if (isDoctor) return '/';
    if (isMentor) return '/mentor/dashboard';
    if (isLabOfficer) return '/';
    if (isPharmacy) return '/';
    if (isMedicalStaff) return '/staff/dashboard';
    return '/';
  };

  const homePath = getHomePath();
  const isOnHomeDashboard = location.pathname === homePath;

  const handleBack = () => {
    // If already on the user's home dashboard, don't navigate away
    if (isOnHomeDashboard) {
      return;
    }
    // For staff roles, "Back" should go to their dashboard instead of browser history
    // to prevent navigating to the generic landing page
    if (isLabOfficer || isPharmacy || isMedicalStaff || isAdmin) {
      navigate(homePath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-primary/10 shadow-sm">
      <div className="container mx-auto px-4 py-2 flex gap-2">
        {!isOnHomeDashboard && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
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
