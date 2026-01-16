import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import nitwLogo from "@/assets/nitw-logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between min-h-[72px]">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img 
              src={nitwLogo} 
              alt="NIT Warangal Logo" 
              className="w-12 h-12 md:w-14 md:h-14 object-contain"
            />
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground leading-tight tracking-tight">
                National Institute of Technology
              </h1>
              <p className="text-xs sm:text-sm text-primary font-medium">
                Warangal, Telangana
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/medical-team" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Medical Team
            </Link>
            <Link to="/appointments" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Book Appointment
            </Link>
            <Link to="/my-appointments" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              My Appointments
            </Link>
            <Link to="/health-dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Health Records
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to="/admin">Admin Portal</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/doctor/register">Doctor Portal</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link to="/medical-team" className="text-muted-foreground hover:text-primary transition-colors font-medium py-2">
                Medical Team
              </Link>
              <Link to="/appointments" className="text-muted-foreground hover:text-primary transition-colors font-medium py-2">
                Book Appointment
              </Link>
              <Link to="/my-appointments" className="text-muted-foreground hover:text-primary transition-colors font-medium py-2">
                My Appointments
              </Link>
              <Link to="/health-dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium py-2">
                Health Records
              </Link>
              <div className="flex flex-col gap-2 pt-2">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link to="/admin">Admin Portal</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to="/doctor/register">Doctor Portal</Link>
                </Button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
