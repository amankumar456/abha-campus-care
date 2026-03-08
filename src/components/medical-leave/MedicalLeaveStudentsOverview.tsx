import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInDays } from "date-fns";
import { toast } from "sonner";
import {
  HeartPulse,
  AlertTriangle,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Mail,
  GraduationCap,
  Activity,
  Stethoscope,
  FileWarning,
  BadgeCheck,
  StickyNote,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface MedicalLeaveStudent {
  id: string;
  status: string;
  referral_hospital: string;
  illness_description: string | null;
  health_priority: string | null;
  rest_days: number | null;
  leave_start_date: string | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  doctor_clearance: boolean | null;
  doctor_clearance_date: string | null;
  doctor_notes: string | null;
  created_at: string;
  health_centre_visited: boolean | null;
  accompanist_name: string | null;
  accompanist_contact: string | null;
  accompanist_type: string | null;
  expected_duration: string;
  student: {
    id: string;
    full_name: string;
    roll_number: string;
    program: string;
    branch: string | null;
    email: string | null;
    phone: string | null;
    batch: string;
  } | null;
  medical_officers: {
    name: string;
  } | null;
}

type FilterTab = "high" | "medium_low" | "on_leave" | "awaiting_clearance" | "cleared";

interface Props {
  doctorId?: string | null;
}

export default function MedicalLeaveStudentsOverview({ doctorId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("high");
  const [clearanceDialogOpen, setClearanceDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MedicalLeaveStudent | null>(null);
  const [doctorNote, setDoctorNote] = useState("");

  const { data: leaveStudents, isLoading } = useQuery({
    queryKey: ["medical-leave-overview", doctorId],
    queryFn: async () => {
      let query = supabase
        .from("medical_leave_requests")
        .select(`
          id, status, referral_hospital, illness_description, health_priority,
          rest_days, leave_start_date, expected_return_date, actual_return_date,
          doctor_clearance, doctor_clearance_date, doctor_notes, created_at,
          health_centre_visited, accompanist_name, accompanist_contact,
          accompanist_type, expected_duration,
          student:student_id (
            id, full_name, roll_number, program, branch, email, phone, batch
          ),
          medical_officers:referring_doctor_id ( name )
        `)
        .in("status", ["on_leave", "return_pending", "returned", "student_form_pending", "doctor_referred"])
        .order("created_at", { ascending: false });

      if (doctorId) {
        query = query.eq("referring_doctor_id", doctorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as MedicalLeaveStudent[]) || [];
    },
  });

  const clearanceMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes: string }) => {
      const { error } = await supabase
        .from("medical_leave_requests")
        .update({
          doctor_clearance: true,
          doctor_clearance_date: new Date().toISOString(),
          status: "returned" as any,
          health_centre_visited: true,
          doctor_notes: notes || null,
        })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Doctor clearance granted successfully!");
      queryClient.invalidateQueries({ queryKey: ["medical-leave-overview"] });
      setClearanceDialogOpen(false);
      setSelectedStudent(null);
      setDoctorNote("");
    },
    onError: () => {
      toast.error("Failed to grant clearance.");
    },
  });

  const handleClearanceClick = (student: MedicalLeaveStudent) => {
    setSelectedStudent(student);
    setDoctorNote(student.doctor_notes || "");
    setClearanceDialogOpen(true);
  };

  const all = leaveStudents || [];

  // Deduplicate: show only latest leave request per student (by student id)
  const latestPerStudent = (() => {
    const map = new Map<string, MedicalLeaveStudent>();
    // Data is already sorted by created_at desc from the query
    for (const leave of all) {
      const studentId = leave.student?.id;
      if (studentId && !map.has(studentId)) {
        map.set(studentId, leave);
      }
    }
    return Array.from(map.values());
  })();

  // Sort helper: closest return date to today first, nulls last
  const sortByReturnDate = (a: MedicalLeaveStudent, b: MedicalLeaveStudent) => {
    const today = new Date();
    const dateA = a.expected_return_date ? Math.abs(differenceInDays(parseISO(a.expected_return_date), today)) : Infinity;
    const dateB = b.expected_return_date ? Math.abs(differenceInDays(parseISO(b.expected_return_date), today)) : Infinity;
    return dateA - dateB;
  };

  // High priority: only active leave cases (exclude returned & cleared)
  const highPriority = latestPerStudent
    .filter((s) => s.health_priority === "high" && s.status !== "returned" && s.doctor_clearance !== true)
    .sort(sortByReturnDate);
  const mediumLow = latestPerStudent
    .filter((s) => s.health_priority !== "high" && s.status !== "returned" && s.doctor_clearance !== true)
    .sort(sortByReturnDate);
  const onLeave = latestPerStudent.filter((s) => s.status !== "returned" && s.doctor_clearance !== true).sort(sortByReturnDate);

  // Awaiting Clearance: students who have returned (status return_pending or actual_return_date set, or past expected_return_date) but not yet cleared
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const awaitingClearance = latestPerStudent
    .filter((s) => {
      if (s.doctor_clearance === true) return false;
      if (s.status === "return_pending") return true;
      if (s.expected_return_date && parseISO(s.expected_return_date) < today && s.status !== "returned") return true;
      if (s.actual_return_date && !s.doctor_clearance) return true;
      return false;
    })
    .sort((a, b) => {
      const dateA = a.expected_return_date ? parseISO(a.expected_return_date).getTime() : Infinity;
      const dateB = b.expected_return_date ? parseISO(b.expected_return_date).getTime() : Infinity;
      return dateA - dateB;
    });

  const cleared = latestPerStudent.filter((s) => s.doctor_clearance === true);

  const counts = {
    high: highPriority.length,
    medium_low: mediumLow.length,
    on_leave: onLeave.length,
    awaiting_clearance: awaitingClearance.length,
    cleared: cleared.length,
  };

  const filteredStudents = (() => {
    switch (activeFilter) {
      case "high": return highPriority;
      case "medium_low": return mediumLow;
      case "on_leave": return onLeave;
      case "awaiting_clearance": return awaitingClearance;
      case "cleared": return cleared;
    }
  })();

  const getLeaveDays = (s: MedicalLeaveStudent) => {
    if (s.rest_days) return s.rest_days;
    if (s.leave_start_date && s.expected_return_date) {
      return differenceInDays(parseISO(s.expected_return_date), parseISO(s.leave_start_date));
    }
    return null;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "doctor_referred": return "Referred";
      case "student_form_pending": return "Form Pending";
      case "on_leave": return "On Leave";
      case "return_pending": return "Return Pending";
      case "returned": return "Returned";
      default: return status;
    }
  };

  const filterTabs: { key: FilterTab; label: string; icon: React.ReactNode; color: string; activeClass: string }[] = [
    {
      key: "high",
      label: "High Priority",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-destructive",
      activeClass: "bg-destructive/15 border-destructive ring-1 ring-destructive/30",
    },
    {
      key: "medium_low",
      label: "Medium / Low",
      icon: <AlertCircle className="h-5 w-5" />,
      color: "text-amber-600 dark:text-amber-400",
      activeClass: "bg-amber-100/60 border-amber-300 ring-1 ring-amber-300/50 dark:bg-amber-900/30 dark:border-amber-700",
    },
    {
      key: "on_leave",
      label: "Currently On Leave",
      icon: <Activity className="h-5 w-5" />,
      color: "text-secondary",
      activeClass: "bg-secondary/15 border-secondary ring-1 ring-secondary/30",
    },
    {
      key: "awaiting_clearance",
      label: "Awaiting Clearance",
      icon: <UserCheck className="h-5 w-5" />,
      color: "text-orange-600 dark:text-orange-400",
      activeClass: "bg-orange-100/60 border-orange-400 ring-1 ring-orange-400/50 dark:bg-orange-900/30 dark:border-orange-700",
    },
    {
      key: "cleared",
      label: "Cleared",
      icon: <ShieldCheck className="h-5 w-5" />,
      color: "text-primary",
      activeClass: "bg-primary/15 border-primary ring-1 ring-primary/30",
    },
  ];

  const renderStudentCard = (leave: MedicalLeaveStudent) => {
    const days = getLeaveDays(leave);
    const isCleared = leave.doctor_clearance === true;
    const isOverdue = leave.expected_return_date && parseISO(leave.expected_return_date) < new Date() && !isCleared;
    const overdueDays = isOverdue ? differenceInDays(new Date(), parseISO(leave.expected_return_date!)) : 0;

    return (
      <div
        key={leave.id}
        className={`rounded-xl border bg-card p-4 transition-all hover:shadow-md ${isOverdue ? 'border-orange-400 ring-1 ring-orange-300/50' : ''}`}
      >
        {/* Top row: student info + badges */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground truncate text-base">
                {leave.student?.full_name || "Unknown"}
              </h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {leave.student?.roll_number} • {leave.student?.program}
                {leave.student?.branch ? ` (${leave.student.branch})` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant={leave.health_priority === "high" ? "destructive" : "outline"}
              className="text-xs capitalize"
            >
              {leave.health_priority || "medium"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {getStatusLabel(leave.status)}
            </Badge>
            {isOverdue && overdueDays > 0 && (
              <Badge className="text-xs bg-orange-500 hover:bg-orange-600 text-white">
                {overdueDays}d overdue
              </Badge>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{leave.referral_hospital}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {leave.leave_start_date
                ? format(parseISO(leave.leave_start_date), "MMM d, yyyy")
                : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{days != null ? `${days} days` : "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              Return:{" "}
              {leave.expected_return_date
                ? format(parseISO(leave.expected_return_date), "MMM d")
                : "—"}
            </span>
          </div>
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
          {leave.student?.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> {leave.student.email}
            </span>
          )}
          {leave.student?.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {leave.student.phone}
            </span>
          )}
        </div>

        {/* Illness description */}
        {leave.illness_description && (
          <p className="text-sm mt-3 p-2.5 rounded-lg bg-muted/50 text-foreground/80">
            <span className="font-medium">Reason:</span> {leave.illness_description}
          </p>
        )}

        {/* Doctor notes (if already saved) */}
        {leave.doctor_notes && (
          <p className="text-sm mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-foreground/80">
            <span className="font-medium flex items-center gap-1 mb-0.5">
              <StickyNote className="h-3.5 w-3.5 text-primary" /> Doctor Note:
            </span>
            {leave.doctor_notes}
          </p>
        )}

        {/* Footer: clearance action */}
        <div className="flex items-center justify-end mt-3 pt-3 border-t">
          {isCleared ? (
            <div className="flex items-center gap-1.5 text-primary">
              <BadgeCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Cleared</span>
              {leave.doctor_clearance_date && (
                <span className="text-xs text-muted-foreground ml-1">
                  on {format(parseISO(leave.doctor_clearance_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => handleClearanceClick(leave)}
            >
              <FileWarning className="h-4 w-4" />
              Grant Clearance
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-dashed border-primary/30">
        <CardHeader>
          <Skeleton className="h-8 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
              <HeartPulse className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Medical Leave Students Details
                <Badge variant="secondary" className="ml-2 text-xs">
                  {latestPerStudent.length} Active
                </Badge>
              </CardTitle>
              <CardDescription>
                Off-campus treatment tracking • Click a category to filter
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filter tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-left ${
                  activeFilter === tab.key
                    ? tab.activeClass
                    : "border-transparent bg-muted/40 hover:bg-muted/70"
                }`}
              >
                <span className={tab.color}>{tab.icon}</span>
                <div>
                  <p className={`text-lg font-bold leading-none ${tab.color}`}>{counts[tab.key]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tab.label}</p>
                </div>
              </button>
            ))}
          </div>

          <Separator />

          {/* Filtered student list */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground">No students in this category</h3>
              <p className="text-sm text-muted-foreground">Try selecting a different filter above</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredStudents.map(renderStudentCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clearance Confirmation Dialog with Doctor Note */}
      <Dialog open={clearanceDialogOpen} onOpenChange={setClearanceDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Confirm Doctor Clearance
            </DialogTitle>
            <DialogDescription>
              Grant medical clearance for{" "}
              <strong>{selectedStudent?.student?.full_name}</strong> ({selectedStudent?.student?.roll_number}).
              This confirms the student has visited the Health Centre and is fit to resume classes.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Hospital</p>
                  <p className="font-medium">{selectedStudent.referral_hospital}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Illness</p>
                  <p className="font-medium">{selectedStudent.illness_description || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Leave Days</p>
                  <p className="font-medium">{getLeaveDays(selectedStudent) ?? "—"} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Priority</p>
                  <p className="font-medium capitalize">{selectedStudent.health_priority || "—"}</p>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <StickyNote className="h-4 w-4 text-primary" />
                  Doctor's Note for Leave
                </label>
                <Textarea
                  value={doctorNote}
                  onChange={(e) => setDoctorNote(e.target.value)}
                  placeholder="Add notes about the student's condition, recovery status, any follow-up recommendations..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This note will be saved with the leave record.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setClearanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedStudent &&
                clearanceMutation.mutate({ requestId: selectedStudent.id, notes: doctorNote })
              }
              disabled={clearanceMutation.isPending}
              className="gap-2"
            >
              <BadgeCheck className="h-4 w-4" />
              {clearanceMutation.isPending ? "Processing..." : "Grant Clearance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
