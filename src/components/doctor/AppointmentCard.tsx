import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Clock, User, FileText, AlertTriangle, CheckCircle, XCircle, Stethoscope, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MedicalLeaveDialog from "./MedicalLeaveDialog";
import PrescriptionDialog from "./PrescriptionDialog";

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  program: string;
  branch: string | null;
  batch: string;
  year_of_study: string | null;
  email?: string | null;
  phone?: string | null;
}

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  health_priority: string | null;
  denial_reason?: string | null;
  approved_at?: string | null;
  denied_at?: string | null;
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
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [showMedicalLeavePrompt, setShowMedicalLeavePrompt] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [denialReason, setDenialReason] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const approveAppointmentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          status: "confirmed",
          approved_at: new Date().toISOString()
        })
        .eq("id", appointment.id);

      if (error) throw error;

      // Create in-app notification for the student
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: appointment.patient_id,
          title: "Appointment Approved",
          message: `Your appointment on ${new Date(appointment.appointment_date).toLocaleDateString()} at ${formatTime(appointment.appointment_time)} has been approved.`,
          type: "approved",
          related_appointment_id: appointment.id
        });

      if (notifError) {
        console.error("Failed to create notification:", notifError);
      }

      // Send notification email
      try {
        await supabase.functions.invoke('send-appointment-notification', {
          body: {
            appointmentId: appointment.id,
            action: 'approved'
          }
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
      }
    },
    onSuccess: () => {
      toast.success("Appointment approved", {
        description: "The student has been notified."
      });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      // Show medical leave prompt after approval
      setShowMedicalLeavePrompt(true);
    },
    onError: () => {
      toast.error("Failed to approve appointment");
    },
  });

  const denyAppointmentMutation = useMutation({
    mutationFn: async (reason: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          status: "cancelled",
          denied_at: new Date().toISOString(),
          denial_reason: reason
        })
        .eq("id", appointment.id);

      if (error) throw error;

      // Create in-app notification for the student
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: appointment.patient_id,
          title: "Appointment Rejected",
          message: `Your appointment on ${new Date(appointment.appointment_date).toLocaleDateString()} at ${formatTime(appointment.appointment_time)} has been rejected. Reason: ${reason}`,
          type: "rejected",
          related_appointment_id: appointment.id
        });

      if (notifError) {
        console.error("Failed to create notification:", notifError);
      }

      // Send notification email
      try {
        await supabase.functions.invoke('send-appointment-notification', {
          body: {
            appointmentId: appointment.id,
            action: 'rejected',
            reason: reason
          }
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
      }
    },
    onSuccess: () => {
      toast.success("Appointment denied", {
        description: "The student has been notified."
      });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      setShowDenyDialog(false);
      setDenialReason("");
    },
    onError: () => {
      toast.error("Failed to deny appointment");
    },
  });

  const handleApprove = () => {
    approveAppointmentMutation.mutate();
  };

  const handleDeny = () => {
    if (!denialReason.trim()) {
      toast.error("Please provide a reason for denial");
      return;
    }
    denyAppointmentMutation.mutate(denialReason);
  };

  const handleMedicalLeaveDecision = (needsLeave: boolean) => {
    setShowMedicalLeavePrompt(false);
    if (needsLeave) {
      setShowLeaveDialog(true);
    } else {
      // No leave needed — open prescription dialog immediately
      setShowPrescriptionDialog(true);
    }
  };

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
                <p 
                  className="font-semibold text-foreground cursor-pointer hover:text-primary hover:underline transition-colors"
                  onClick={() => student?.roll_number && navigate(`/student-profile/${student.roll_number}`)}
                >
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
                {/* Show denial reason if denied */}
                {appointment.status === "cancelled" && appointment.denial_reason && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Denial: {appointment.denial_reason}
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
              {/* Pending appointments: Show Approve/Deny */}
              {appointment.status === "pending" && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleApprove}
                    disabled={approveAppointmentMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDenyDialog(true)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Deny
                  </Button>
                </>
              )}

              {/* Confirmed appointments: Show Issue Leave and Complete */}
              {appointment.status === "confirmed" && (
                <>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setShowLeaveDialog(true)}
                   >
                     <AlertTriangle className="w-4 h-4 mr-1" />
                     Issue Leave
                   </Button>
                   <Button
                     variant="secondary"
                     size="sm"
                     onClick={() => setShowPrescriptionDialog(true)}
                   >
                     Complete
                   </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deny Dialog */}
      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Deny Appointment
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this appointment. The student will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for Denial</Label>
              <Textarea
                placeholder="E.g., Slot unavailable, please reschedule for tomorrow..."
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDenyDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeny}
                disabled={denyAppointmentMutation.isPending}
              >
                {denyAppointmentMutation.isPending ? "Denying..." : "Confirm Denial"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medical Leave Prompt Dialog — two clear paths */}
      <Dialog open={showMedicalLeavePrompt} onOpenChange={setShowMedicalLeavePrompt}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Appointment Approved — Next Step
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              <span className="font-medium text-foreground">{student?.full_name || "The student"}</span>'s appointment is confirmed.
              Does this patient require <strong>medical leave</strong> or just a <strong>prescription</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {/* Path 1 — No Leave, Prescribe */}
            <button
              onClick={() => handleMedicalLeaveDecision(false)}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">No Leave Needed</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Issue a prescription / treatment plan for the patient
                </p>
              </div>
              <Badge variant="outline" className="text-xs border-primary text-primary">
                Open Prescription →
              </Badge>
            </button>

            {/* Path 2 — Issue Medical Leave */}
            <button
              onClick={() => handleMedicalLeaveDecision(true)}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Issue Medical Leave</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Refer the student for off-campus hospital treatment
                </p>
              </div>
              <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                Open Leave Referral →
              </Badge>
            </button>
          </div>

          <div className="mt-3 pt-3 border-t">
            <button
              onClick={() => setShowMedicalLeavePrompt(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
            >
              Skip for now — decide later from the appointment card
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medical Leave Dialog */}
      {student && (
        <MedicalLeaveDialog
          open={showLeaveDialog}
          onOpenChange={setShowLeaveDialog}
          student={student}
          doctorId={doctorId}
          appointmentId={appointment.id}
          healthPriority={appointment.health_priority || "medium"}
        />
      )}

      {/* Prescription Dialog */}
      <PrescriptionDialog
        open={showPrescriptionDialog}
        onOpenChange={setShowPrescriptionDialog}
        appointmentId={appointment.id}
        patientId={appointment.patient_id}
        doctorId={doctorId}
        studentName={student?.full_name || "Student"}
        onCompleted={() => {}}
      />
    </>
  );
};

export default AppointmentCard;
