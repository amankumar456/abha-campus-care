import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import BackNavigation from "@/components/BackNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Building2, Calendar, CheckCircle2, Clock, FileText, Home, Stethoscope, User } from "lucide-react";
import DoctorReferralForm from "@/components/medical-leave/DoctorReferralForm";
import StudentLeaveForm from "@/components/medical-leave/StudentLeaveForm";
import ReturnNotificationForm from "@/components/medical-leave/ReturnNotificationForm";
import LeaveStatusCard from "@/components/medical-leave/LeaveStatusCard";
import { format } from "date-fns";

type MedicalLeaveStatus = "doctor_referred" | "student_form_pending" | "on_leave" | "return_pending" | "returned" | "cancelled";

interface LeaveRequest {
  id: string;
  student_id: string;
  referring_doctor_id: string | null;
  referral_date: string;
  referral_hospital: string;
  expected_duration: string;
  doctor_notes: string | null;
  illness_description: string | null;
  leave_start_date: string | null;
  expected_return_date: string | null;
  accompanist_type: string | null;
  accompanist_name: string | null;
  accompanist_contact: string | null;
  accompanist_relationship: string | null;
  student_form_submitted_at: string | null;
  actual_return_date: string | null;
  hospital_discharge_date: string | null;
  follow_up_notes: string | null;
  return_submitted_at: string | null;
  status: MedicalLeaveStatus;
  created_at: string;
  updated_at: string;
  students?: {
    full_name: string;
    roll_number: string;
    program: string;
  } | null;
  medical_officers?: {
    name: string;
  } | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "student_form_pending":
      return <Badge variant="outline" className="bg-amber-100 text-amber-800">Form Pending</Badge>;
    case "on_leave":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">On Leave</Badge>;
    case "return_pending":
      return <Badge variant="outline" className="bg-purple-100 text-purple-800">Return Pending</Badge>;
    case "returned":
      return <Badge variant="outline" className="bg-green-100 text-green-800">Returned</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const MedicalLeave = () => {
  const { user, isDoctor, isStudent, isMentor, isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("status");
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);

  // Fetch student's current leave request
  const { data: studentLeaveRequest, isLoading: studentLeaveLoading } = useQuery({
    queryKey: ["student-leave-status", user?.id],
    queryFn: async () => {
      // First get the student's ID
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!studentData) return null;

      // Get the most recent active leave request
      const { data, error } = await supabase
        .from("medical_leave_requests")
        .select(`
          *,
          medical_officers(name)
        `)
        .eq("student_id", studentData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as LeaveRequest | null;
    },
    enabled: isStudent && !!user,
  });

  // Fetch all leave requests for doctors/mentors/admins
  const { data: allLeaveRequests, isLoading: allLeaveLoading } = useQuery({
    queryKey: ["medical-leave-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_leave_requests")
        .select(`
          *,
          students(full_name, roll_number, program),
          medical_officers(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeaveRequest[];
    },
    enabled: (isDoctor || isMentor || isAdmin) && !!user,
  });

  useEffect(() => {
    if (!roleLoading && !user) {
      navigate("/auth");
    }
  }, [user, roleLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const pendingFormRequest = studentLeaveRequest?.status === "student_form_pending" ? studentLeaveRequest : null;
  const activeLeaveRequest = studentLeaveRequest && ["on_leave", "return_pending"].includes(studentLeaveRequest.status) 
    ? studentLeaveRequest : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <BackNavigation />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Medical Leave Management</h1>
            <p className="text-muted-foreground mt-1">
              {isStudent && "Track and manage your off-campus medical leave"}
              {isDoctor && "Refer students for external treatment and track leave requests"}
              {isMentor && "Monitor your mentees' medical leave status"}
              {isAdmin && "Oversee all medical leave requests"}
            </p>
          </div>
        </div>

        {/* Student View */}
        {isStudent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Card */}
            <div className="lg:col-span-1">
              <LeaveStatusCard
                leaveRequest={studentLeaveRequest}
                onFillForm={() => setShowLeaveForm(true)}
                onSubmitReturn={() => setShowReturnForm(true)}
              />
            </div>

            {/* Forms Column */}
            <div className="lg:col-span-2">
              {/* Pending Leave Form */}
              {pendingFormRequest && !showReturnForm && (
                <StudentLeaveForm
                  leaveRequest={pendingFormRequest}
                  onSuccess={() => setShowLeaveForm(false)}
                />
              )}

              {/* Return Notification Form */}
              {activeLeaveRequest && showReturnForm && (
                <ReturnNotificationForm
                  leaveRequest={activeLeaveRequest}
                  onSuccess={() => setShowReturnForm(false)}
                />
              )}

              {/* No Active Leave */}
              {!pendingFormRequest && !activeLeaveRequest && (
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                  <CardContent className="pt-12 pb-12 text-center">
                    <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold mb-2">No Active Leave Request</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      You don't have any pending medical leave requests. If you need off-campus 
                      treatment, please visit the campus medical center for evaluation.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* On Leave Status */}
              {activeLeaveRequest && !showReturnForm && (
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-500/5 to-blue-500/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-500/10">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Currently On Leave</CardTitle>
                        <CardDescription>
                          You are on off-campus medical leave
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Return Notification Required</AlertTitle>
                      <AlertDescription>
                        When you return to the hostel, please submit the return notification 
                        within 2 hours of arrival.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={() => setShowReturnForm(true)} 
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Submit Return Notification
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Doctor View */}
        {isDoctor && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="referral" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                New Referral
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Referrals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="referral">
              <div className="max-w-2xl">
                <DoctorReferralForm />
              </div>
            </TabsContent>

            <TabsContent value="requests">
              <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <CardTitle>My Referrals</CardTitle>
                  <CardDescription>
                    Students you have referred for off-campus treatment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allLeaveLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : allLeaveRequests?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No referrals yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Hospital</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allLeaveRequests?.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{request.students?.full_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {request.students?.roll_number}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{request.referral_hospital}</TableCell>
                              <TableCell>
                                {format(new Date(request.referral_date), "PP")}
                              </TableCell>
                              <TableCell>{getStatusBadge(request.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Mentor/Admin View */}
        {(isMentor || isAdmin) && (
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {isMentor ? "Mentee Leave Requests" : "All Leave Requests"}
              </CardTitle>
              <CardDescription>
                {isMentor 
                  ? "Medical leave status of your assigned students"
                  : "Overview of all medical leave requests in the system"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allLeaveLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : allLeaveRequests?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No leave requests found</p>
                  <p className="text-sm">All students are currently on campus</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Hospital</TableHead>
                        <TableHead>Referred By</TableHead>
                        <TableHead>Leave Period</TableHead>
                        <TableHead>Accompanist</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLeaveRequests?.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.students?.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {request.students?.roll_number} • {request.students?.program}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{request.referral_hospital}</p>
                              {request.illness_description && (
                                <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                                  {request.illness_description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{request.medical_officers?.name || "—"}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(request.referral_date), "PP")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.leave_start_date ? (
                              <div className="text-sm">
                                <p>{format(new Date(request.leave_start_date), "PP")}</p>
                                <p className="text-muted-foreground">
                                  to {request.expected_return_date 
                                    ? format(new Date(request.expected_return_date), "PP")
                                    : "TBD"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {request.accompanist_name ? (
                              <div className="text-sm">
                                <p>{request.accompanist_name}</p>
                                <p className="text-muted-foreground">
                                  {request.accompanist_relationship}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MedicalLeave;
