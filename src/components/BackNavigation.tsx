import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const BackNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home page
  if (location.pathname === "/") {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(-1)}
        className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border-primary/20 text-primary"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/")}
        className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border-primary/20 text-primary"
      >
        <Home className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default BackNavigation;
