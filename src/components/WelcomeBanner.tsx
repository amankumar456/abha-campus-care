import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Stethoscope, LogIn, X, Sparkles } from "lucide-react";

export default function WelcomeBanner() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show if loading, user is logged in, or dismissed
  if (isLoading || user || isDismissed) {
    return null;
  }

  return (
    <section className="py-6 px-4">
      <div className="container mx-auto max-w-6xl">
        <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20 overflow-hidden relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardContent className="py-8 px-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Icon */}
              <div className="shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome to NIT Warangal Health Portal
                </h2>
                <p className="text-muted-foreground mb-4 max-w-2xl">
                  Sign in to book appointments with medical officers, access your health records, 
                  get medical certificates, and manage your healthcare journey seamlessly.
                </p>
                
                {/* Benefits */}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Book Appointments Online
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Access Health Records
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Digital Certificates
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    24/7 Emergency Support
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/auth">
                    <GraduationCap className="w-5 h-5" />
                    Student Sign In
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="gap-2">
                  <Link to="/auth">
                    <Stethoscope className="w-5 h-5" />
                    Doctor Sign In
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
