import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, User, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import MedicalLeaveDialog from "./MedicalLeaveDialog";

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  program: string;
  branch: string | null;
  batch: string;
  year_of_study: string | null;
  email: string | null;
  phone: string | null;
}

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  health_priority: string | null;
  student?: Student;
}

interface AppointmentCardProps {
  appointment: Appointment;
  doctorId: string;
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

const getPriorityColor = (priority: string | null) => {
  switch (priority) {
    case "high":
      return "bg-destructive text-destructive-foreground";
    case "medium":
      return "bg-amber-500 text-white";
    case "low":
      return "bg-green-500 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge variant="default">Confirmed</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "completed":
      return <Badge variant="outline" className="border-green-500 text-green-600">Completed</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const AppointmentCard = ({ appointment, doctorId }: AppointmentCardProps) => {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const queryClient = useQueryClient();

  const updatePriorityMutation = useMutation({
    mutationFn: async (priority: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ health_priority: priority })
        .eq("id", appointment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Priority updated");
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    },
    onError: () => {
      toast.error("Failed to update priority");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: "pending" | "confirmed" | "completed" | "cancelled") => {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appointment status updated");
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const student = appointment.student;

  return (
    <>
      <Card className="border hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Patient Info */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {student?.full_name || "Unknown Student"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {student?.roll_number || "N/A"} • {student?.program || ""}
                  {student?.branch && ` • ${student.branch}`}
                </p>
                {appointment.reason && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {appointment.reason}
                  </p>
                )}
              </div>
            </div>

            {/* Time & Status */}
            <div className="text-right space-y-2">
              <p className="text-sm font-medium text-foreground flex items-center gap-1 justify-end">
                <Clock className="w-4 h-4" />
                {formatTime(appointment.appointment_time)}
              </p>
              {getStatusBadge(appointment.status)}
            </div>
          </div>

          {/* Actions Row */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between gap-4">
            {/* Priority Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Priority:</span>
              <Select
                value={appointment.health_priority || "medium"}
                onValueChange={(value) => updatePriorityMutation.mutate(value)}
                disabled={updatePriorityMutation.isPending}
              >
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      High
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Badge className={getPriorityColor(appointment.health_priority)}>
                {appointment.health_priority?.toUpperCase() || "MEDIUM"}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {appointment.health_priority === "high" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowLeaveDialog(true)}
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Issue Leave
                </Button>
              )}
              {appointment.status === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatusMutation.mutate("confirmed")}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Confirm
                </Button>
              )}
              {appointment.status !== "completed" && appointment.status !== "cancelled" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateStatusMutation.mutate("completed")}
                >
                  Complete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Leave Dialog */}
      {student && (
        <MedicalLeaveDialog
          open={showLeaveDialog}
          onOpenChange={setShowLeaveDialog}
          student={student}
          doctorId={doctorId}
          appointmentId={appointment.id}
        />
      )}
    </>
  );
};

export default AppointmentCard;
