import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  GraduationCap,
  Building2,
  Calendar,
  FileText,
  Send,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

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

interface MedicalLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  doctorId: string;
  appointmentId: string;
  healthPriority?: string;
}

const MedicalLeaveDialog = ({
  open,
  onOpenChange,
  student,
  doctorId,
  appointmentId,
  healthPriority = "medium",
}: MedicalLeaveDialogProps) => {
  const queryClient = useQueryClient();
  const [referralHospital, setReferralHospital] = useState("");
  const [restDays, setRestDays] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [selectedPriority, setSelectedPriority] = useState(healthPriority);

  const createLeaveMutation = useMutation({
    mutationFn: async () => {
      const days = parseInt(restDays);
      if (isNaN(days) || days < 1) {
        throw new Error("Please enter valid number of rest days");
      }

      // Create medical leave request with auto-filled student data
      const { error } = await supabase.from("medical_leave_requests").insert({
        student_id: student.id,
        referring_doctor_id: doctorId,
        referral_hospital: referralHospital || "NIT Warangal Health Centre",
        expected_duration: `${days} days`,
        rest_days: days,
        doctor_notes: doctorNotes || null,
        status: "student_form_pending",
        academic_leave_approved: true,
        approved_by_doctor_id: doctorId,
        approval_date: new Date().toISOString(),
        health_priority: selectedPriority,
        appointment_id: appointmentId,
      });

      if (error) throw error;

      // Update appointment status
      await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);
    },
    onSuccess: () => {
      toast.success("Medical leave approved", {
        description: `Leave letter generated for ${student.full_name}. Student will be notified.`,
      });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["medical-leave-requests"] });
      onOpenChange(false);
      // Reset form
      setReferralHospital("");
      setRestDays("");
      setDoctorNotes("");
      setSelectedPriority("medium");
    },
    onError: (error: any) => {
      toast.error("Failed to create leave request", {
        description: error.message || "Please try again",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restDays) {
      toast.error("Please specify number of rest days");
      return;
    }
    createLeaveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-primary" />
            Issue Medical Leave Letter
          </DialogTitle>
          <DialogDescription>
            Approve academic leave for the student. Their details are auto-filled from the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information - Auto-filled */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Student Information (Auto-filled)</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <p className="font-medium">{student.full_name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Roll Number</Label>
                <p className="font-medium">{student.roll_number}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Program</Label>
                <p className="font-medium">{student.program}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Branch</Label>
                <p className="font-medium">{student.branch || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Batch</Label>
                <p className="font-medium">{student.batch}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Year of Study</Label>
                <p className="font-medium">{student.year_of_study || "N/A"}</p>
              </div>
              {student.email && (
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{student.email}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Medical Leave Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Leave Details</Label>
            </div>

            {/* Health Priority Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Health Condition Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedPriority}
                onValueChange={setSelectedPriority}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Low - Minor illness, rest recommended
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Medium - Moderate condition, treatment required
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      High - Serious condition, urgent care needed
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This priority level will be pre-filled on the student's leave form
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restDays" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Number of Rest Days <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="restDays"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="Enter days (e.g., 3)"
                  value={restDays}
                  onChange={(e) => setRestDays(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Student will be excused from academic work for this duration
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Referral Hospital (if any)
                </Label>
                <Input
                  id="hospital"
                  placeholder="Leave blank for Health Centre"
                  value={referralHospital}
                  onChange={(e) => setReferralHospital(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Medical Description / Doctor's Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Enter diagnosis, treatment plan, and any special instructions..."
                rows={4}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This will appear on the leave letter and be shared with academic authorities
              </p>
            </div>
          </div>

          {/* Declaration */}
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Medical Declaration
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  By approving this leave, I certify that the student requires rest from academic 
                  activities for the specified duration due to medical reasons.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createLeaveMutation.isPending || !restDays}
            >
              {createLeaveMutation.isPending ? (
                "Processing..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Approve & Generate Leave Letter
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MedicalLeaveDialog;
