import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
// Mentor Home Page - Faculty Mentor Landing
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  LayoutDashboard, 
  Activity, 
  Stethoscope, 
  ArrowRight, 
  ClipboardList, 
  UserCircle,
  Bell
} from "lucide-react";

export default function MentorHome() {
  const navigate = useNavigate();
  const { user, isMentor, loading } = useUserRole();

  const fullName = user?.user_metadata?.full_name || "Mentor";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-xl" />
            <div className="grid md:grid-cols-3 gap-4">
              <div className="h-40 bg-muted rounded-lg" />
              <div className="h-40 bg-muted rounded-lg" />
              <div className="h-40 bg-muted rounded-lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const quickLinks = [
    {
      title: "My Dashboard",
      description: "View mentees, health visits, and follow-ups",
      icon: LayoutDashboard,
      path: "/mentor/dashboard",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "My Profile",
      description: "Manage your profile and notification settings",
      icon: UserCircle,
      path: "/mentor/profile",
      color: "bg-secondary/10 text-secondary",
    },
    {
      title: "Medical Team",
      description: "View doctors and health centre staff",
      icon: Stethoscope,
      path: "/medical-team",
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      title: "Health Analytics",
      description: "View mentee health trends and statistics",
      icon: Activity,
      path: "/health-dashboard",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      title: "Medical Leave",
      description: "Track mentee medical leave requests",
      icon: ClipboardList,
      path: "/medical-leave",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: "Appointments",
      description: "View mentee appointment schedules",
      icon: Bell,
      path: "/my-appointments",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome, {fullName}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Faculty Mentor — NIT Warangal Health Portal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((link) => (
            <Card
              key={link.path}
              className="group hover:shadow-lg transition-all cursor-pointer border hover:border-primary/30"
              onClick={() => navigate(link.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${link.color}`}>
                    <link.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Go to Dashboard CTA */}
        <div className="mt-8 text-center">
          <Button
            size="lg"
            onClick={() => navigate("/mentor/dashboard")}
            className="gap-2"
          >
            <LayoutDashboard className="w-5 h-5" />
            Open Full Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
