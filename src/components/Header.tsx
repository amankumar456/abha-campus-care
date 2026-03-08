import { Menu, X, Search, LogIn, UserPlus, GraduationCap, Stethoscope, LogOut, User, Users, Settings, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import nitwLogo from "@/assets/nitw-logo.png";
import NotificationBell from "@/components/notifications/NotificationBell";

const NAVIGATION_ITEMS = [
  { label: "Home", path: "/", keywords: ["home", "main", "landing"] },
  { label: "Medical Team", path: "/medical-team", keywords: ["doctors", "staff", "medical", "team", "officers"] },
  { label: "Book Appointment", path: "/appointments", keywords: ["book", "appointment", "schedule", "visit"] },
  { label: "My Appointments", path: "/my-appointments", keywords: ["my", "appointments", "scheduled", "upcoming"] },
  { label: "Health Records", path: "/student/profile?tab=records", keywords: ["health", "records", "history", "dashboard", "visits", "prescriptions"] },
  { label: "Sign In", path: "/auth", keywords: ["sign", "login", "auth", "account"] },
  { label: "Admin Portal", path: "/admin", keywords: ["admin", "portal", "management"] },
  { label: "Doctor Portal", path: "/doctor/register", keywords: ["doctor", "portal", "register"] },
  { label: "Student Registration", path: "/student/register", keywords: ["student", "registration", "enroll"] },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isDoctor, isMentor, isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading) {
      setIsLoading(false);
    }
  }, [roleLoading]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
      navigate("/");
    }
  };

  const filteredItems = NAVIGATION_ITEMS.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(query) ||
      item.keywords.some((keyword) => keyword.includes(query))
    );
  });

  const handleSelect = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setShowResults(false);
    setIsSearchOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getUserType = () => {
    if (isDoctor) return 'doctor';
    if (isMentor) return 'mentor';
    if (isAdmin) return 'admin';
    return user?.user_metadata?.user_type || 'student';
  };

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isDoctor) return '/doctor/dashboard';
    if (isMentor) return '/mentor/dashboard';
    return '/health-dashboard';
  };

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
          <div className="hidden md:flex items-center gap-4">
            {/* Search Bar */}
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Quick search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  className="pl-9 w-48 lg:w-64 h-9 bg-background"
                />
              </div>
              {showResults && searchQuery && (
                <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  {filteredItems.length > 0 ? (
                    <ul className="py-1">
                      {filteredItems.map((item) => (
                        <li key={item.path}>
                          <button
                            onClick={() => handleSelect(item.path)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No results found</p>
                  )}
                </div>
              )}
            </div>

            <nav className="flex items-center gap-4 lg:gap-6">
              <Link to="/medical-team" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
                Medical Team
              </Link>
              <Link to="/appointments" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
                Appointments
              </Link>
              <Link to="/student/profile?tab=records" className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
                Health Records
              </Link>
              
              {/* Auth Section */}
              {isLoading ? (
                <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
              ) : user ? (
                <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      {getUserType() === 'doctor' ? (
                        <Stethoscope className="w-4 h-4" />
                      ) : getUserType() === 'mentor' ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <GraduationCap className="w-4 h-4" />
                      )}
                      <span className="max-w-[100px] truncate">{getUserDisplayName()}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{getUserDisplayName()}</p>
                      <p className="text-xs text-muted-foreground">
                        {isDoctor ? 'Medical Officer' : isMentor ? 'Faculty Mentor' : isAdmin ? 'Admin' : 'Student'}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={
                        isDoctor ? '/doctor/profile' : 
                        isMentor ? '/mentor/profile' :
                        isAdmin ? '/admin' :
                        '/student/profile'
                      } className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={getDashboardPath()} className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        My Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-appointments" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        My Appointments
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={
                        isDoctor ? '/doctor/profile?tab=settings' :
                        isMentor ? '/mentor/profile?tab=settings' :
                        '/student/profile?tab=settings'
                      } className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link to="/auth">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="gap-2">
                    <Link to="/auth">
                      <UserPlus className="w-4 h-4" />
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              className="p-2"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </button>
            <button 
              className="p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="md:hidden py-3 border-t border-border animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                className="pl-9 bg-background"
                autoFocus
              />
            </div>
            {showResults && searchQuery && (
              <div className="mt-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                {filteredItems.length > 0 ? (
                  <ul className="py-1">
                    {filteredItems.map((item) => (
                      <li key={item.path}>
                        <button
                          onClick={() => handleSelect(item.path)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No results found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {/* User Info for Mobile */}
              {user && (
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    getUserType() === 'doctor' ? 'bg-secondary/10' : 'bg-primary/10'
                  }`}>
                    {getUserType() === 'doctor' ? (
                      <Stethoscope className="w-5 h-5 text-secondary" />
                    ) : (
                      <GraduationCap className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{getUserDisplayName()}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              
              <Link to="/medical-team" className="text-muted-foreground hover:text-primary transition-colors font-medium py-2">
                Medical Team
              </Link>
              <Link to="/appointments" className="text-muted-foreground hover:text-primary transition-colors font-medium py-2">
                Book Appointment
              </Link>
              <Link to="/my-appointments" className="text-muted-foreground hover:text-primary transition-colors font-medium py-2">
                My Appointments
              </Link>
              <Link to="/student/profile?tab=records" className="text-muted-foreground hover:text-primary transition-colors font-medium py-2">
                Health Records
              </Link>
              <div className="flex flex-col gap-2 pt-2">
                {user ? (
                  <Button variant="destructive" className="w-full gap-2" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full gap-2">
                      <Link to="/auth">
                        <GraduationCap className="w-4 h-4" />
                        New User / Student
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="w-full gap-2">
                      <Link to="/auth">
                        <Stethoscope className="w-4 h-4" />
                        Doctor / Medical Staff
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
