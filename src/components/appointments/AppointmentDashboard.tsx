import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User as SupabaseUser } from "@supabase/supabase-js";
import HealthProfileCard from "./HealthProfileCard";
import UpcomingAppointmentsCard from "./UpcomingAppointmentsCard";
import QuickBookCard from "./QuickBookCard";
import { Calendar, LogIn } from "lucide-react";

const AppointmentDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: appointments } = useQuery({
    queryKey: ['upcoming-appointments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          medical_officers(name, designation),
          visiting_doctors(name, specialization)
        `)
        .eq('patient_id', user.id)
        .neq('status', 'cancelled')
        .neq('status', 'completed')
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .order('appointment_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: healthStats } = useQuery({
    queryKey: ['health-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: visits, error } = await supabase
        .from('health_visits')
        .select('id, visit_date, reason_category, follow_up_required')
        .order('visit_date', { ascending: false });
      
      if (error) return null;
      
      const thisMonthVisits = visits?.filter(v => 
        new Date(v.visit_date) >= firstDayOfMonth
      ).length || 0;
      
      const pendingFollowups = visits?.filter(v => v.follow_up_required).length || 0;
      
      return {
        totalVisits: visits?.length || 0,
        thisMonthVisits,
        pendingFollowups,
        lastVisitDate: visits?.[0]?.visit_date 
          ? new Date(visits[0].visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'No visits yet'
      };
    },
    enabled: !!user
  });

  const formattedAppointments = appointments?.map(apt => ({
    id: apt.id,
    doctorName: apt.medical_officers?.name || apt.visiting_doctors?.name || 'Unknown',
    doctorSpecialty: apt.medical_officers?.designation || apt.visiting_doctors?.specialization || '',
    date: new Date(apt.appointment_date),
    time: apt.appointment_time,
    reason: apt.reason || undefined,
    status: apt.status as 'pending' | 'confirmed' | 'completed' | 'cancelled'
  })) || [];

  if (loading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#1A202C] mb-3">
              Appointment Dashboard
            </h2>
            <p className="text-[#4A5568] max-w-2xl mx-auto">
              Sign in to manage your appointments, view health records, and book new consultations
            </p>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
            <p className="text-muted-foreground mb-6">
              Please sign in to access your personalized health dashboard and appointment management.
            </p>
            <Button asChild size="lg">
              <Link to="/auth">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Continue
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#1A202C] mb-3">
            Appointment Dashboard
          </h2>
          <p className="text-[#4A5568] max-w-2xl mx-auto">
            Manage your health appointments and records in one place
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthProfileCard
            userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'}
            totalVisits={healthStats?.totalVisits || 0}
            thisMonthVisits={healthStats?.thisMonthVisits || 0}
            pendingFollowups={healthStats?.pendingFollowups || 0}
            lastVisitDate={healthStats?.lastVisitDate || 'No visits yet'}
          />
          
          <UpcomingAppointmentsCard
            appointments={formattedAppointments}
          />
          
          <QuickBookCard />
        </div>
      </div>
    </section>
  );
};

export default AppointmentDashboard;
