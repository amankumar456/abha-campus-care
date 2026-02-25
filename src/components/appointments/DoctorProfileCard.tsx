import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Users, ClipboardList, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DoctorProfileCardProps {
  userId: string;
}

const DoctorProfileCard = ({ userId }: DoctorProfileCardProps) => {
  const navigate = useNavigate();

  const { data: doctorInfo } = useQuery({
    queryKey: ['doctor-profile-card', userId],
    queryFn: async () => {
      const { data: doctor } = await supabase
        .from('medical_officers')
        .select('id, name, designation, qualification, is_senior')
        .eq('user_id', userId)
        .maybeSingle();

      if (!doctor) return null;

      const today = format(new Date(), 'yyyy-MM-dd');

      const [
        { count: todayAppointments },
        { count: pendingAppointments },
        { count: activeLeaves },
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('medical_officer_id', doctor.id)
          .eq('appointment_date', today),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('medical_officer_id', doctor.id)
          .eq('status', 'pending'),
        supabase
          .from('medical_leave_requests')
          .select('id', { count: 'exact', head: true })
          .eq('referring_doctor_id', doctor.id)
          .in('status', ['doctor_referred', 'student_form_pending', 'on_leave']),
      ]);

      return {
        ...doctor,
        todayAppointments: todayAppointments || 0,
        pendingAppointments: pendingAppointments || 0,
        activeLeaves: activeLeaves || 0,
      };
    },
    enabled: !!userId,
  });

  return (
    <Card className="h-full bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          Doctor Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Doctor Info */}
        <div className="space-y-1">
          <p className="font-semibold text-foreground text-lg">
            {doctorInfo?.name || 'Loading...'}
          </p>
          <p className="text-sm text-muted-foreground">
            {doctorInfo?.designation}
          </p>
          <p className="text-xs text-muted-foreground">
            {doctorInfo?.qualification}
          </p>
          {doctorInfo?.is_senior && (
            <Badge variant="secondary" className="mt-1 text-xs">
              Senior Medical Officer
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="pt-3 border-t space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Today's Summary
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="flex flex-col items-center p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <ClipboardList className="w-5 h-5 text-primary mb-1" />
              <span className="text-xl font-bold text-foreground">
                {doctorInfo?.todayAppointments ?? '-'}
              </span>
              <span className="text-[10px] text-muted-foreground">Today</span>
            </button>
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="flex flex-col items-center p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Clock className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-xl font-bold text-foreground">
                {doctorInfo?.pendingAppointments ?? '-'}
              </span>
              <span className="text-[10px] text-muted-foreground">Pending</span>
            </button>
            <button
              onClick={() => navigate('/medical-leave')}
              className="flex flex-col items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Users className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xl font-bold text-foreground">
                {doctorInfo?.activeLeaves ?? '-'}
              </span>
              <span className="text-[10px] text-muted-foreground">On Leave</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            size="sm"
            onClick={() => navigate('/doctor/profile')}
          >
            <Stethoscope className="w-4 h-4 mr-1" />
            My Profile
          </Button>
          <Button
            variant="default"
            className="flex-1"
            size="sm"
            onClick={() => navigate('/doctor/dashboard')}
          >
            <ClipboardList className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorProfileCard;
