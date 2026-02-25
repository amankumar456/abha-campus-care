import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";
import HealthProfileCard from "./HealthProfileCard";
import UpcomingAppointmentsCard from "./UpcomingAppointmentsCard";
import QuickBookCard from "./QuickBookCard";
import { Calendar, LogIn } from "lucide-react";

const AppointmentDashboard = () => {
  const { user, isDoctor, isMentor, isStudent, loading: roleLoading } = useUserRole();

  // Determine profile path based on role
  const getProfilePath = () => {
    if (isDoctor) return '/doctor/profile';
    if (isMentor) return '/mentor/profile';
    return '/student/profile';
  };

  const getDashboardPath = () => {
    if (isDoctor) return '/doctor/dashboard';
    if (isMentor) return '/mentor/dashboard';
    return '/health-dashboard';
  };

  // Fetch student profile with emergency contacts
  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, full_name, roll_number, mentor_name, mentor_contact')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (studentError || !student) return null;
      
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('emergency_contact, emergency_relationship, father_name, father_contact, mother_name, mother_contact')
        .eq('student_id', student.id)
        .maybeSingle();
      
      const isProfileComplete = !!(profile?.emergency_contact);
      
      return {
        fullName: student.full_name,
        rollNumber: student.roll_number,
        mentorName: student.mentor_name,
        mentorContact: student.mentor_contact,
        isProfileComplete,
        emergencyContacts: profile ? {
          emergencyContact: profile.emergency_contact || undefined,
          emergencyRelationship: profile.emergency_relationship || undefined,
          fatherName: profile.father_name || undefined,
          fatherContact: profile.father_contact || undefined,
          motherName: profile.mother_name || undefined,
          motherContact: profile.mother_contact || undefined,
        } : undefined
      };
    },
    enabled: !!user && !isDoctor && !isMentor
  });

  const { data: appointments } = useQuery({
    queryKey: ['upcoming-appointments-home', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const today = new Date().toISOString().split('T')[0];
      
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
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: healthStats } = useQuery({
    queryKey: ['health-stats-home', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      // Get student id
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let healthVisitCount = 0;
      let thisMonthHealthVisits = 0;
      let pendingFollowups = 0;
      let lastVisitDate: string | null = null;

      if (student) {
        const { data: visits } = await supabase
          .from('health_visits')
          .select('id, visit_date, follow_up_required')
          .eq('student_id', student.id)
          .order('visit_date', { ascending: false });

        healthVisitCount = visits?.length || 0;
        thisMonthHealthVisits = visits?.filter(v => new Date(v.visit_date) >= firstDayOfMonth).length || 0;
        pendingFollowups = visits?.filter(v => v.follow_up_required).length || 0;
        lastVisitDate = visits?.[0]?.visit_date
          ? new Date(visits[0].visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : null;
      }

      // Also count completed appointments
      const { data: completedAppts } = await supabase
        .from('appointments')
        .select('id, appointment_date')
        .eq('patient_id', user.id)
        .eq('status', 'completed');

      const completedCount = completedAppts?.length || 0;
      const thisMonthCompleted = completedAppts?.filter(a => new Date(a.appointment_date) >= firstDayOfMonth).length || 0;

      if (!lastVisitDate && completedAppts?.[0]) {
        lastVisitDate = new Date(completedAppts[0].appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      
      return {
        totalVisits: healthVisitCount + completedCount,
        thisMonthVisits: thisMonthHealthVisits + thisMonthCompleted,
        pendingFollowups,
        lastVisitDate: lastVisitDate || 'No visits yet'
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
    status: apt.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
    appointmentDate: apt.appointment_date,
  })) || [];

  if (roleLoading) {
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
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Appointment Dashboard
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
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
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10">
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Appointment Dashboard
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Manage your health appointments and records in one place
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button asChild variant="outline">
              <Link to={getProfilePath()}>My Profile</Link>
            </Button>
            <Button asChild>
              <Link to={getDashboardPath()}>Go to Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthProfileCard
            userName={studentProfile?.fullName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
            rollNumber={studentProfile?.rollNumber}
            mentorName={studentProfile?.mentorName || 'Not Assigned'}
            mentorContact={studentProfile?.mentorContact}
            totalVisits={healthStats?.totalVisits || 0}
            thisMonthVisits={healthStats?.thisMonthVisits || 0}
            pendingFollowups={healthStats?.pendingFollowups || 0}
            lastVisitDate={healthStats?.lastVisitDate || 'No visits yet'}
            isProfileComplete={studentProfile?.isProfileComplete || false}
            emergencyContacts={studentProfile?.emergencyContacts}
            profilePath={getProfilePath()}
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
