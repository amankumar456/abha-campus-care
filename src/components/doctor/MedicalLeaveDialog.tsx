import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getMentorUserId } from "@/lib/notifications/medical-leave-notifications";
import { cn } from "@/lib/utils";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  User,
  GraduationCap,
  Building2,
  Calendar,
  FileText,
  Send,
  AlertCircle,
  AlertTriangle,
  ChevronsUpDown,
  Check,
} from "lucide-react";

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
  const navigate = useNavigate();
  const [referralHospital, setReferralHospital] = useState("");
  const [restDays, setRestDays] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [selectedPriority, setSelectedPriority] = useState(healthPriority);
  const [referredForTreatment, setReferredForTreatment] = useState(false);
  const [referredForTest, setReferredForTest] = useState(false);
  const [testDetails, setTestDetails] = useState("");

  const { data: hospitals = [] } = useQuery({
    queryKey: ["empanelled-hospitals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empanelled_hospitals")
        .select("id, name, location")
        .eq("is_active", true)
        .order("serial_number");
      if (error) throw error;
      return data;
    },
  });

  const createLeaveMutation = useMutation({
    mutationFn: async () => {
      const days = parseInt(restDays);
      if (isNaN(days) || days < 0) {
        throw new Error("Please enter valid number of rest days (0 or more)");
      }

      // Fetch the current doctor's name for the notification
      const { data: doctorData } = await supabase
        .from("medical_officers")
        .select("name")
        .eq("id", doctorId)
        .maybeSingle();

      const doctorName = doctorData?.name || "The doctor";

      // Fetch the student's user_id and mentor_id for notifications
      const { data: studentUser } = await supabase
        .from("students")
        .select("user_id, mentor_id")
        .eq("id", student.id)
        .maybeSingle();

      const hospital = referralHospital || "NIT Warangal Health Centre";

      // Build referral type array
      const referralTypes: string[] = [];
      if (referredForTreatment) referralTypes.push("treatment");
      if (referredForTest) referralTypes.push("test_checkup");

      // Create medical leave request with auto-filled student data
      const { data: leaveData, error } = await supabase.from("medical_leave_requests").insert({
        student_id: student.id,
        referring_doctor_id: doctorId,
        referral_hospital: hospital,
        expected_duration: days > 0 ? `${days} days` : "Test/Checkup only",
        rest_days: days,
        doctor_notes: [doctorNotes, testDetails ? `Test/Checkup: ${testDetails}` : ""].filter(Boolean).join(" | ") || null,
        status: "student_form_pending",
        academic_leave_approved: true,
        approved_by_doctor_id: doctorId,
        approval_date: new Date().toISOString(),
        health_priority: selectedPriority,
        appointment_id: appointmentId,
        referral_type: referralTypes,
      }).select("id").single();

      if (error) throw error;

      // Update appointment status to completed
      await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);

      // 1. Notify student — actionable message to fill departure form
      if (studentUser?.user_id) {
        const referralInfo = referralTypes.length > 0 
          ? ` Referral: ${referralTypes.includes("treatment") ? "Treatment" : ""}${referralTypes.length === 2 ? " & " : ""}${referralTypes.includes("test_checkup") ? "Test/Checkup" : ""} at ${hospital}.${testDetails ? ` (${testDetails})` : ""}`
          : "";
        await supabase.from("notifications").insert({
          user_id: studentUser.user_id,
          title: "📋 Medical Leave Granted",
          message: `${doctorName} has marked medical leave${days > 0 ? ` for ${days} day${days > 1 ? "s" : ""} rest` : ""}.${referralInfo} ⚠️ Please fill the departure form before leaving the health centre. Open Medical Leave section to complete your form.`,
          type: "medical_leave_referral",
          related_appointment_id: appointmentId,
        });
      }

      // 2. Notify mentor about student's medical leave
      if (studentUser?.mentor_id) {
        const mentorUserId = await getMentorUserId(studentUser.mentor_id);
        if (mentorUserId) {
          await supabase.from("notifications").insert({
            user_id: mentorUserId,
            title: "🏥 Mentee Medical Leave",
            message: `Your mentee ${student.full_name} (${student.roll_number}) has been granted medical leave for ${days} day${days > 1 ? "s" : ""} by ${doctorName}. They are referred to ${hospital}.`,
            type: "mentee_leave_on_leave",
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Medical leave approved", {
        description: `Leave letter generated for ${student.full_name}. Student has been notified to fill the form.`,
      });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["medical-leave-requests"] });
      onOpenChange(false);
      // Reset form
      setReferralHospital("");
      setRestDays("");
      setDoctorNotes("");
      setSelectedPriority("medium");
      setReferredForTreatment(false);
      setReferredForTest(false);
      setTestDetails("");
      // Redirect to Medical Leave Management section
      navigate("/medical-leave");
    },
    onError: (error: any) => {
      toast.error("Failed to create leave request", {
        description: error.message || "Please try again",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restDays === "" || restDays === undefined) {
      toast.error("Please specify number of rest days");
      return;
    }
    const days = parseInt(restDays);
    if (days === 0 && !referredForTreatment && !referredForTest) {
      toast.error("If rest days is 0, you must select at least one referral option (Treatment or Test/Checkup)");
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
                  min="0"
                  max="30"
                  placeholder="Enter days (0 for test/checkup only)"
                  value={restDays}
                  onChange={(e) => setRestDays(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {restDays === "0" 
                    ? "Student is being referred for outside campus visit only" 
                    : "Student will be excused from academic work for this duration"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Referral Hospital (if any)
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {referralHospital || "NIT Warangal Health Centre (default)"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0 pointer-events-auto" align="start">
                    <Command>
                      <CommandInput placeholder="Search hospital..." />
                      <CommandEmpty>No hospital found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        <CommandItem
                          value="NIT Warangal Health Centre"
                          onSelect={() => setReferralHospital("NIT Warangal Health Centre")}
                        >
                          <Check className={cn("mr-2 h-4 w-4", referralHospital === "NIT Warangal Health Centre" ? "opacity-100" : "opacity-0")} />
                          NIT Warangal Health Centre
                        </CommandItem>
                        {hospitals.map((h) => (
                          <CommandItem
                            key={h.id}
                            value={`${h.name} ${h.location}`}
                            onSelect={() => setReferralHospital(h.name)}
                          >
                            <Check className={cn("mr-2 h-4 w-4", referralHospital === h.name ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span>{h.name}</span>
                              <span className="text-xs text-muted-foreground">{h.location}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Outside Campus Referral Type */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Outside Campus Referral {restDays === "0" && <span className="text-destructive">* (required when 0 rest days)</span>}
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Select if the student is being referred outside campus. Both can be selected.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReferredForTreatment(!referredForTreatment)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    referredForTreatment 
                      ? "border-primary bg-primary/10 ring-1 ring-primary" 
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      referredForTreatment ? "border-primary bg-primary" : "border-muted-foreground/40"
                    }`}>
                      {referredForTreatment && <span className="text-primary-foreground text-xs">✓</span>}
                    </div>
                    <span className="font-medium text-sm">Referred for Treatment</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Student needs treatment at an outside hospital
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setReferredForTest(!referredForTest)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    referredForTest 
                      ? "border-primary bg-primary/10 ring-1 ring-primary" 
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      referredForTest ? "border-primary bg-primary" : "border-muted-foreground/40"
                    }`}>
                      {referredForTest && <span className="text-primary-foreground text-xs">✓</span>}
                    </div>
                    <span className="font-medium text-sm">Referred for Test/Checkup</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Student needs tests or checkup at an outside facility
                  </p>
                </button>
              </div>

              {referredForTest && (
                <div className="space-y-2 ml-1">
                  <Label htmlFor="testDetails" className="text-sm">
                    Test/Checkup Details (optional)
                  </Label>
                  <Input
                    id="testDetails"
                    placeholder="e.g., MRI scan, Blood test, X-ray..."
                    value={testDetails}
                    onChange={(e) => setTestDetails(e.target.value)}
                  />
                </div>
              )}

              {restDays === "0" && !referredForTreatment && !referredForTest && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Please select at least one referral option when rest days is 0
                </p>
              )}
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
              disabled={createLeaveMutation.isPending || restDays === "" || (restDays === "0" && !referredForTreatment && !referredForTest)}
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
