import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

interface Props {
  /** Pass doctorId to scope to that doctor's referrals; omit for admin (all) */
  doctorId?: string | null;
}

export default function MedicalLeaveStudentsOverview({ doctorId }: Props) {
  const queryClient = useQueryClient();
  const [clearanceDialogOpen, setClearanceDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MedicalLeaveStudent | null>(null);

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
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("medical_leave_requests")
        .update({
          doctor_clearance: true,
          doctor_clearance_date: new Date().toISOString(),
          status: "returned" as any,
          health_centre_visited: true,
        })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Doctor clearance granted successfully!");
      queryClient.invalidateQueries({ queryKey: ["medical-leave-overview"] });
      setClearanceDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: () => {
      toast.error("Failed to grant clearance.");
    },
  });

  const handleClearanceClick = (student: MedicalLeaveStudent) => {
    setSelectedStudent(student);
    setClearanceDialogOpen(true);
  };

  // Sort: high priority first, then medium, then low
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...(leaveStudents || [])].sort((a, b) => {
    const pa = priorityOrder[a.health_priority || "low"] ?? 3;
    const pb = priorityOrder[b.health_priority || "low"] ?? 3;
    return pa - pb;
  });

  const highPriority = sorted.filter((s) => s.health_priority === "high");
  const otherPriority = sorted.filter((s) => s.health_priority !== "high");

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

  const renderStudentCard = (leave: MedicalLeaveStudent) => {
    const days = getLeaveDays(leave);
    const isCleared = leave.doctor_clearance === true;
    const isHigh = leave.health_priority === "high";

    return (
      <Card
        key={leave.id}
        className={`border-l-4 transition-shadow hover:shadow-md ${
          isHigh
            ? "border-l-destructive bg-destructive/5"
            : "border-l-amber-400 bg-amber-50/30 dark:bg-amber-950/10"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Student Info */}
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                  isHigh
                    ? "bg-destructive/15 text-destructive"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}
              >
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground truncate">
                    {leave.student?.full_name || "Unknown"}
                  </h4>
                  {isHigh ? (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3" /> High Priority
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 gap-1 text-xs">
                      <AlertCircle className="h-3 w-3" /> Medium
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs gap-1">
                    {getStatusLabel(leave.status)}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {leave.student?.roll_number} • {leave.student?.program}{leave.student?.branch ? ` (${leave.student.branch})` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {leave.referral_hospital}
                  </span>
                  {leave.student?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {leave.student.email}
                    </span>
                  )}
                  {leave.student?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {leave.student.phone}
                    </span>
                  )}
                </div>
                {leave.illness_description && (
                  <p className="text-sm mt-1 text-foreground/80">
                    <span className="font-medium">Reason:</span> {leave.illness_description}
                  </p>
                )}
              </div>
            </div>

            {/* Leave Details & Action */}
            <div className="flex items-center gap-4 lg:gap-6 shrink-0">
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5">
                  <Calendar className="h-3 w-3" /> Leave
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {leave.leave_start_date
                    ? format(parseISO(leave.leave_start_date), "MMM d")
                    : "—"}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5">
                  <Clock className="h-3 w-3" /> Days
                </div>
                <p className="text-sm font-semibold text-foreground">{days ?? "—"}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5">
                  <Calendar className="h-3 w-3" /> Return
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {leave.expected_return_date
                    ? format(parseISO(leave.expected_return_date), "MMM d")
                    : "—"}
                </p>
              </div>

              {/* Clearance Button */}
              {isCleared ? (
                <div className="flex items-center gap-1.5 text-primary">
                  <BadgeCheck className="h-5 w-5" />
                  <span className="text-xs font-medium">Cleared</span>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 animate-pulse hover:animate-none"
                  onClick={() => handleClearanceClick(leave)}
                >
                  <FileWarning className="h-4 w-4" />
                  Approve
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
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
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
              <HeartPulse className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Medical Leave Students Details
                <Badge variant="secondary" className="ml-2 text-xs">
                  {sorted.length} Active
                </Badge>
              </CardTitle>
              <CardDescription>
                Off-campus treatment tracking • High priority cases shown first
              </CardDescription>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-lg font-bold text-destructive">{highPriority.length}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100/50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{otherPriority.length}</p>
                <p className="text-xs text-muted-foreground">Medium/Low</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
              <Activity className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-lg font-bold text-secondary">{sorted.filter((s) => s.status === "on_leave").length}</p>
                <p className="text-xs text-muted-foreground">Currently On Leave</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-primary">{sorted.filter((s) => s.doctor_clearance).length}</p>
                <p className="text-xs text-muted-foreground">Cleared</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {sorted.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground">No active medical leave students</h3>
              <p className="text-sm text-muted-foreground">All students are on campus</p>
            </div>
          ) : (
            <>
              {highPriority.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    High Priority — Immediate Attention Required
                  </div>
                  {highPriority.map(renderStudentCard)}
                </div>
              )}

              {otherPriority.length > 0 && (
                <div className="space-y-2">
                  {highPriority.length > 0 && <Separator className="my-4" />}
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    <Stethoscope className="h-4 w-4" />
                    Medium & Other Priority Cases
                  </div>
                  {otherPriority.map(renderStudentCard)}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Clearance Confirmation Dialog */}
      <Dialog open={clearanceDialogOpen} onOpenChange={setClearanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Confirm Doctor Clearance
            </DialogTitle>
            <DialogDescription>
              You are about to grant medical clearance for{" "}
              <strong>{selectedStudent?.student?.full_name}</strong> ({selectedStudent?.student?.roll_number}).
              This confirms the student has visited the Health Centre and is fit to resume classes.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-3 py-2">
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
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setClearanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedStudent && clearanceMutation.mutate(selectedStudent.id)}
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
