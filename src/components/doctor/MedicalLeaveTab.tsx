import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { 
  FileText, 
  ClipboardList, 
  CalendarClock, 
  ChevronRight, 
  User, 
  Building2, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  Printer,
  MoreHorizontal,
  Send,
  RefreshCw,
  Siren,
  Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import DoctorReferralForm from "@/components/medical-leave/DoctorReferralForm";
import PrintableReferralLetter from "@/components/medical-leave/PrintableReferralLetter";
import EmergencyDashboard from "@/components/doctor/EmergencyDashboard";

interface LeaveRequest {
  id: string;
  status: string;
  referral_hospital: string;
  illness_description: string | null;
  health_priority: string | null;
  rest_days: number | null;
  leave_start_date: string | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  created_at: string;
  doctor_notes: string | null;
  student: {
    id: string;
    full_name: string;
    roll_number: string;
    program: string;
    branch: string | null;
    email: string | null;
  } | null;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "doctor_referred":
      return { label: "Referred", color: "bg-primary/10 text-primary border-primary/20", icon: Send };
    case "student_form_pending":
      return { label: "Awaiting Form", color: "bg-warning/20 text-warning-foreground border-warning/30", icon: Clock };
    case "student_form_submitted":
      return { label: "Form Submitted", color: "bg-accent/20 text-accent-foreground border-accent/30", icon: FileText };
    case "on_leave":
      return { label: "On Leave", color: "bg-secondary/20 text-secondary-foreground border-secondary/30", icon: Building2 };
    case "returned":
      return { label: "Returned", color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2 };
    case "completed":
      return { label: "Completed", color: "bg-muted text-muted-foreground border-muted", icon: CheckCircle2 };
    default:
      return { label: status, color: "bg-muted text-muted-foreground border-muted", icon: AlertCircle };
  }
};

const getPriorityBadge = (priority: string | null) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> High</Badge>;
    case "medium":
      return <Badge className="bg-warning/20 text-warning-foreground border-warning/30 gap-1"><AlertCircle className="h-3 w-3" /> Medium</Badge>;
    case "low":
      return <Badge variant="secondary" className="gap-1">Low</Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
};

export default function MedicalLeaveTab() {
  const { doctorId } = useUserRole();
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState("new-referral");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [referralFilter, setReferralFilter] = useState<"all" | "pending" | "on_leave" | "completed">("all");

  // Fetch doctor's referrals
  const { data: referrals, isLoading: referralsLoading, refetch } = useQuery({
    queryKey: ["doctor-referrals", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      
      const { data, error } = await supabase
        .from("medical_leave_requests")
        .select(`
          id,
          status,
          referral_hospital,
          illness_description,
          health_priority,
          rest_days,
          leave_start_date,
          expected_return_date,
          actual_return_date,
          created_at,
          doctor_notes,
          student:student_id (
            id,
            full_name,
            roll_number,
            program,
            branch,
            email
          )
        `)
        .eq("referring_doctor_id", doctorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as LeaveRequest[]) || [];
    },
    enabled: !!doctorId,
  });

  const studentDedupKey = (request: LeaveRequest) => {
    const rollNumber = request.student?.roll_number?.trim().toLowerCase();
    if (rollNumber) return `roll:${rollNumber}`;

    const studentId = request.student?.id?.trim();
    if (studentId) return `id:${studentId}`;

    const fullName = request.student?.full_name?.trim().toLowerCase();
    if (fullName) return `name:${fullName}`;

    return `request:${request.id}`;
  };

  const latestUniqueReferrals = useMemo(() => {
    if (!referrals?.length) return [];

    const latestByStudent = new Map<string, LeaveRequest>();

    for (const request of referrals) {
      const dedupeKey = studentDedupKey(request);
      if (!latestByStudent.has(dedupeKey)) {
        latestByStudent.set(dedupeKey, request);
      }
    }

    return Array.from(latestByStudent.values()).sort((a, b) => {
      const nameA = a.student?.full_name?.trim().toLowerCase() || "";
      const nameB = b.student?.full_name?.trim().toLowerCase() || "";
      if (nameA !== nameB) {
        return nameA.localeCompare(nameB);
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [referrals]);

  const filteredReferrals = useMemo(() => {
    if (referralFilter === "all") return latestUniqueReferrals;

    return latestUniqueReferrals.filter((request) => {
      if (referralFilter === "pending") {
        return ["doctor_referred", "student_form_pending", "student_form_submitted"].includes(request.status);
      }
      if (referralFilter === "on_leave") {
        return request.status === "on_leave";
      }
      if (referralFilter === "completed") {
        return ["returned", "completed"].includes(request.status);
      }
      return true;
    });
  }, [latestUniqueReferrals, referralFilter]);

  // Stats for quick overview (deduplicated by student roll number)
  const stats = {
    total: latestUniqueReferrals.length,
    pending: latestUniqueReferrals.filter((r) => ["doctor_referred", "student_form_pending", "student_form_submitted"].includes(r.status)).length,
    onLeave: latestUniqueReferrals.filter((r) => r.status === "on_leave").length,
    completed: latestUniqueReferrals.filter((r) => ["returned", "completed"].includes(r.status)).length,
  };

  const handleViewDetails = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs for Medical Leave actions */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-4">
            <TabsTrigger value="emergency" className="gap-2">
              <Siren className="h-4 w-4" />
              <span className="hidden sm:inline">Emergency</span>
            </TabsTrigger>
            <TabsTrigger value="new-referral" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Referral</span>
            </TabsTrigger>
            <TabsTrigger value="my-referrals" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">My Cases</span>
              {stats.pending > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="follow-ups" className="gap-2">
              <CalendarClock className="h-4 w-4" />
              <span className="hidden sm:inline">Follow-ups</span>
            </TabsTrigger>
          </TabsList>

          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Emergency Dashboard Tab */}
        <TabsContent value="emergency" className="mt-0">
          <EmergencyDashboard />
        </TabsContent>

        {/* New Referral Tab */}
        <TabsContent value="new-referral" className="mt-0">
          <DoctorReferralForm />
        </TabsContent>

        {/* My Referrals Tab */}
        <TabsContent value="my-referrals" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    My Referrals
                  </CardTitle>
                  <CardDescription>
                    Track students you've referred for off-campus treatment
                  </CardDescription>
                </div>
              </div>

              {/* Quick Stats - Clickable Filters */}
              <div className="grid grid-cols-4 gap-3 pt-4">
                <button
                  onClick={() => setReferralFilter("all")}
                  className={`text-center p-3 rounded-lg transition-all cursor-pointer ${
                    referralFilter === "all" ? "bg-muted ring-2 ring-primary/30" : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </button>
                <button
                  onClick={() => setReferralFilter("pending")}
                  className={`text-center p-3 rounded-lg transition-all cursor-pointer ${
                    referralFilter === "pending" ? "bg-warning/20 ring-2 ring-warning/40 border-warning/30" : "bg-warning/10 border border-warning/20 hover:bg-warning/20"
                  }`}
                >
                  <p className="text-2xl font-bold text-warning-foreground">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </button>
                <button
                  onClick={() => setReferralFilter("on_leave")}
                  className={`text-center p-3 rounded-lg transition-all cursor-pointer ${
                    referralFilter === "on_leave" ? "bg-secondary/20 ring-2 ring-secondary/40 border-secondary/30" : "bg-secondary/10 border border-secondary/20 hover:bg-secondary/20"
                  }`}
                >
                  <p className="text-2xl font-bold text-secondary-foreground">{stats.onLeave}</p>
                  <p className="text-xs text-muted-foreground">On Leave</p>
                </button>
                <button
                  onClick={() => setReferralFilter("completed")}
                  className={`text-center p-3 rounded-lg transition-all cursor-pointer ${
                    referralFilter === "completed" ? "bg-primary/15 ring-2 ring-primary/30 border-primary/30" : "bg-primary/5 border border-primary/20 hover:bg-primary/15"
                  }`}
                >
                  <p className="text-2xl font-bold text-primary">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </button>
              </div>
            </CardHeader>

            <CardContent>
              {referralsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : latestUniqueReferrals.length > 0 ? (
                filteredReferrals.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Student</TableHead>
                          <TableHead>Hospital</TableHead>
                          <TableHead className="hidden md:table-cell">Leave Days</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReferrals.map((request) => {
                          const statusConfig = getStatusConfig(request.status);
                          const StatusIcon = statusConfig.icon;
                          return (
                            <TableRow key={request.id} className="hover:bg-muted/30">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{request.student?.full_name || "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground">{request.student?.roll_number}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[150px]">
                                  <p className="text-sm truncate">{request.referral_hospital}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {request.leave_start_date ? format(parseISO(request.leave_start_date), "MMM d") : "-"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{request.rest_days || "-"} days</span>
                                </div>
                              </TableCell>
                              <TableCell>{getPriorityBadge(request.health_priority)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`gap-1 ${statusConfig.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDetails(request)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    {request.student && (
                                      <DropdownMenuItem asChild>
                                        <PrintableReferralLetter
                                          data={{
                                            studentName: request.student.full_name,
                                            rollNumber: request.student.roll_number,
                                            program: request.student.program,
                                            branch: request.student.branch,
                                            hospital: { name: request.referral_hospital, location: "" },
                                            illnessDescription: request.illness_description || "",
                                            leaveDays: request.rest_days || 0,
                                            healthPriority: request.health_priority || "medium",
                                            doctorNotes: request.doctor_notes || undefined,
                                          }}
                                        />
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-base font-medium text-foreground">No {referralFilter === "all" ? "" : referralFilter.replace("_", " ")} referrals</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {referralFilter !== "all" ? "Try selecting a different filter" : "Create a new referral to get started"}
                    </p>
                    {referralFilter !== "all" && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => setReferralFilter("all")}>
                        Show All
                      </Button>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No referrals yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a new referral to get started
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveSubTab("new-referral")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Referral
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-ups Tab */}
        <TabsContent value="follow-ups" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                Follow-up Tracker
              </CardTitle>
              <CardDescription>
                Track returning students and pending follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Deduplicate by student roll number, keep latest */}
                  {(() => {
                    const followUpItems = referrals?.filter(r => r.status === "on_leave" || r.status === "returned") || [];
                    const uniqueByStudent = new Map<string, typeof followUpItems[0]>();
                    for (const item of followUpItems) {
                      const key = item.student?.roll_number || item.id;
                      if (!uniqueByStudent.has(key) || new Date(item.created_at) > new Date(uniqueByStudent.get(key)!.created_at)) {
                        uniqueByStudent.set(key, item);
                      }
                    }
                    const dedupedItems = Array.from(uniqueByStudent.values()).sort((a, b) =>
                      (a.student?.full_name || '').localeCompare(b.student?.full_name || '')
                    );

                    if (dedupedItems.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground">No pending follow-ups</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            All referred students have completed their treatment
                          </p>
                        </div>
                      );
                    }

                    return dedupedItems.map((request) => (
                      <Card key={request.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">{request.student?.full_name}</h4>
                                <p className="text-sm text-muted-foreground">{request.student?.roll_number}</p>
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">{request.referral_hospital}</span>
                                </div>
                                {request.expected_return_date && (
                                  <div className="flex items-center gap-2 mt-1 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Expected: {format(parseISO(request.expected_return_date), "MMM d, yyyy")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="outline" className={getStatusConfig(request.status).color}>
                                {getStatusConfig(request.status).label}
                              </Badge>
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Referral Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this medical leave referral
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedRequest.student?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.student?.roll_number} • {selectedRequest.student?.program}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Hospital</p>
                  <p className="font-medium">{selectedRequest.referral_hospital}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Leave Days</p>
                  <p className="font-medium">{selectedRequest.rest_days} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Priority</p>
                  <div className="mt-0.5">{getPriorityBadge(selectedRequest.health_priority)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className={`mt-0.5 ${getStatusConfig(selectedRequest.status).color}`}>
                    {getStatusConfig(selectedRequest.status).label}
                  </Badge>
                </div>
                {selectedRequest.leave_start_date && (
                  <div>
                    <p className="text-muted-foreground">Leave Start</p>
                    <p className="font-medium">{format(parseISO(selectedRequest.leave_start_date), "MMM d, yyyy")}</p>
                  </div>
                )}
                {selectedRequest.expected_return_date && (
                  <div>
                    <p className="text-muted-foreground">Expected Return</p>
                    <p className="font-medium">{format(parseISO(selectedRequest.expected_return_date), "MMM d, yyyy")}</p>
                  </div>
                )}
              </div>

              {/* Illness Description */}
              {selectedRequest.illness_description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Illness Description</p>
                  <p className="text-sm bg-muted/50 p-2 rounded-md">{selectedRequest.illness_description}</p>
                </div>
              )}

              {/* Doctor Notes */}
              {selectedRequest.doctor_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Doctor's Notes</p>
                  <p className="text-sm bg-muted/50 p-2 rounded-md">{selectedRequest.doctor_notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {selectedRequest.student && (
                  <PrintableReferralLetter
                    data={{
                      studentName: selectedRequest.student.full_name,
                      rollNumber: selectedRequest.student.roll_number,
                      program: selectedRequest.student.program,
                      branch: selectedRequest.student.branch,
                      hospital: { name: selectedRequest.referral_hospital, location: "" },
                      illnessDescription: selectedRequest.illness_description || "",
                      leaveDays: selectedRequest.rest_days || 0,
                      healthPriority: selectedRequest.health_priority || "medium",
                      doctorNotes: selectedRequest.doctor_notes || undefined,
                    }}
                  />
                )}
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
