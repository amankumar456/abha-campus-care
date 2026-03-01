import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { ShieldCheck, Search, FileText, ClipboardCheck, AlertTriangle, CheckCircle2, User, Calendar, Building } from "lucide-react";
import { format } from "date-fns";

interface VerifiedStudent {
  id: string;
  full_name: string;
  roll_number: string;
  email: string | null;
  branch: string | null;
  program: string;
  batch: string;
}

interface LeaveRequest {
  id: string;
  status: string;
  referral_hospital: string;
  expected_duration: string;
  doctor_notes: string | null;
  referral_date: string | null;
  referring_doctor_id: string | null;
  rest_days: number | null;
  illness_description: string | null;
  doctor?: { name: string };
}

export default function MedicalStaffDashboard() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [activeTab, setActiveTab] = useState("leave");
  
  // Student verification state
  const [rollNumber, setRollNumber] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState<VerifiedStudent | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [verificationError, setVerificationError] = useState("");

  // Certificate state
  const [certRollNumber, setCertRollNumber] = useState("");
  const [certEmail, setCertEmail] = useState("");
  const [certVerifiedStudent, setCertVerifiedStudent] = useState<VerifiedStudent | null>(null);
  const [certVerifying, setCertVerifying] = useState(false);
  const [certError, setCertError] = useState("");

  const verifyStudent = async () => {
    if (!rollNumber.trim() || !studentEmail.trim()) {
      setVerificationError("Both roll number and email are required");
      return;
    }

    setVerifying(true);
    setVerificationError("");
    setVerifiedStudent(null);
    setLeaveRequests([]);

    try {
      const { data: student, error } = await supabase
        .from("students")
        .select("id, full_name, roll_number, email, branch, program, batch")
        .eq("roll_number", rollNumber.trim().toUpperCase())
        .eq("email", studentEmail.trim().toLowerCase())
        .single();

      if (error || !student) {
        setVerificationError("Student not found. Please verify the roll number and email.");
        setVerifying(false);
        return;
      }

      setVerifiedStudent(student);

      // Check for approved medical leave
      const today = new Date().toISOString().split('T')[0];
      const { data: leaves } = await supabase
        .from("medical_leave_requests")
        .select(`
          id, status, referral_hospital, expected_duration, doctor_notes, 
          referral_date, referring_doctor_id, rest_days, illness_description
        `)
        .eq("student_id", student.id)
        .in("status", ["doctor_referred", "student_form_pending", "on_leave"]);

      // Enrich with doctor names
      const enrichedLeaves: LeaveRequest[] = [];
      for (const leave of leaves || []) {
        let doctor = null;
        if (leave.referring_doctor_id) {
          const { data: d } = await supabase
            .from("medical_officers")
            .select("name")
            .eq("id", leave.referring_doctor_id)
            .single();
          doctor = d;
        }
        enrichedLeaves.push({ ...leave, doctor: doctor || undefined });
      }

      setLeaveRequests(enrichedLeaves);

      toast({
        title: "✅ Student Verified",
        description: `${student.full_name} (${student.roll_number}) verified successfully`,
      });
    } catch (err: any) {
      setVerificationError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const verifyCertStudent = async () => {
    if (!certRollNumber.trim() || !certEmail.trim()) {
      setCertError("Both roll number and email are required");
      return;
    }

    setCertVerifying(true);
    setCertError("");
    setCertVerifiedStudent(null);

    try {
      const { data: student, error } = await supabase
        .from("students")
        .select("id, full_name, roll_number, email, branch, program, batch")
        .eq("roll_number", certRollNumber.trim().toUpperCase())
        .eq("email", certEmail.trim().toLowerCase())
        .single();

      if (error || !student) {
        setCertError("Student not found. Please verify the roll number and email.");
        setCertVerifying(false);
        return;
      }

      setCertVerifiedStudent(student);
      toast({
        title: "✅ Student Verified",
        description: `${student.full_name} verified for certificate issuance`,
      });
    } catch (err: any) {
      setCertError(err.message);
    } finally {
      setCertVerifying(false);
    }
  };

  const clearVerification = () => {
    setRollNumber("");
    setStudentEmail("");
    setVerifiedStudent(null);
    setLeaveRequests([]);
    setVerificationError("");
  };

  const clearCertVerification = () => {
    setCertRollNumber("");
    setCertEmail("");
    setCertVerifiedStudent(null);
    setCertError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-orange-600" />
            </div>
            Medical Staff Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Issue medical leave referrals and medical certificates</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leave" className="flex items-center gap-1">
              <FileText className="w-4 h-4" /> Issue Medical Leave
            </TabsTrigger>
            <TabsTrigger value="certificate" className="flex items-center gap-1">
              <ClipboardCheck className="w-4 h-4" /> Issue Certificate
            </TabsTrigger>
          </TabsList>

          {/* Medical Leave Tab */}
          <TabsContent value="leave" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Verify Student Identity
                </CardTitle>
                <CardDescription>
                  Enter the student's roll number and official email to verify their identity and check doctor-approved medical leave
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input
                      placeholder="e.g., 21CS1234"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Official Email</Label>
                    <Input
                      type="email"
                      placeholder="student@student.nitw.ac.in"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                  </div>
                </div>
                {verificationError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {verificationError}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={verifyStudent} disabled={verifying}>
                    <Search className="w-4 h-4 mr-1" />
                    {verifying ? "Verifying..." : "Verify Student"}
                  </Button>
                  <Button variant="outline" onClick={clearVerification}>Clear</Button>
                </div>
              </CardContent>
            </Card>

            {verifiedStudent && (
              <Card className="border-green-200 bg-green-50/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Student Verified</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div><p className="text-muted-foreground">Name</p><p className="font-medium">{verifiedStudent.full_name}</p></div>
                    <div><p className="text-muted-foreground">Roll Number</p><p className="font-medium">{verifiedStudent.roll_number}</p></div>
                    <div><p className="text-muted-foreground">Branch</p><p className="font-medium">{verifiedStudent.branch || "N/A"}</p></div>
                    <div><p className="text-muted-foreground">Programme</p><p className="font-medium">{verifiedStudent.program}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {verifiedStudent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Doctor-Approved Medical Leave Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaveRequests.length === 0 ? (
                    <div className="p-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="font-medium text-yellow-800">No Active Medical Leave Found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        No doctor has approved medical leave for this student. Medical leave can only be issued after a doctor's referral.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaveRequests.map((leave) => (
                        <Card key={leave.id} className="border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={leave.status === "on_leave" ? "default" : "secondary"}>
                                    {leave.status.replace(/_/g, " ").toUpperCase()}
                                  </Badge>
                                  {leave.rest_days && (
                                    <Badge variant="outline">{leave.rest_days} day(s) rest</Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Building className="w-3 h-3 text-muted-foreground" />
                                    <span>Hospital: {leave.referral_hospital}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-muted-foreground" />
                                    <span>Doctor: Dr. {leave.doctor?.name || "Unknown"}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span>Duration: {leave.expected_duration}</span>
                                  </div>
                                  {leave.referral_date && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-muted-foreground" />
                                      <span>Referred: {format(new Date(leave.referral_date), "dd MMM yyyy")}</span>
                                    </div>
                                  )}
                                </div>
                                {leave.illness_description && (
                                  <p className="text-sm"><strong>Description:</strong> {leave.illness_description}</p>
                                )}
                                {leave.doctor_notes && (
                                  <p className="text-sm"><strong>Doctor Notes:</strong> {leave.doctor_notes}</p>
                                )}
                              </div>
                              <div>
                                <Badge className="bg-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Doctor Approved
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <p className="text-sm text-muted-foreground mt-2">
                        ✅ Medical leave has been approved by the doctor. You may proceed with issuing the referral letter and hospital card from the Medical Leave page.
                      </p>
                      <Button 
                        className="w-full"
                        onClick={() => window.location.href = "/medical-leave"}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Go to Medical Leave Page to Issue Documents
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Certificate Tab */}
          <TabsContent value="certificate" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Verify Student for Certificate
                </CardTitle>
                <CardDescription>
                  Enter the student's roll number and official email to verify identity before issuing certificates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input
                      placeholder="e.g., 21CS1234"
                      value={certRollNumber}
                      onChange={(e) => setCertRollNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Official Email</Label>
                    <Input
                      type="email"
                      placeholder="student@student.nitw.ac.in"
                      value={certEmail}
                      onChange={(e) => setCertEmail(e.target.value)}
                    />
                  </div>
                </div>
                {certError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {certError}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={verifyCertStudent} disabled={certVerifying}>
                    <Search className="w-4 h-4 mr-1" />
                    {certVerifying ? "Verifying..." : "Verify Student"}
                  </Button>
                  <Button variant="outline" onClick={clearCertVerification}>Clear</Button>
                </div>
              </CardContent>
            </Card>

            {certVerifiedStudent && (
              <>
                <Card className="border-green-200 bg-green-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Student Verified</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div><p className="text-muted-foreground">Name</p><p className="font-medium">{certVerifiedStudent.full_name}</p></div>
                      <div><p className="text-muted-foreground">Roll Number</p><p className="font-medium">{certVerifiedStudent.roll_number}</p></div>
                      <div><p className="text-muted-foreground">Branch</p><p className="font-medium">{certVerifiedStudent.branch || "N/A"}</p></div>
                      <div><p className="text-muted-foreground">Programme</p><p className="font-medium">{certVerifiedStudent.program}</p></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Issue Certificate</CardTitle>
                    <CardDescription>Select the type of certificate to issue for this student</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary"
                        onClick={() => {
                          toast({
                            title: "Medical Certificate",
                            description: `Medical certificate for ${certVerifiedStudent.full_name} can be generated from the Doctor Dashboard by the attending physician.`,
                          });
                        }}
                      >
                        <FileText className="w-6 h-6 text-primary" />
                        <span className="font-medium">Medical Certificate</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-green-600"
                        onClick={() => {
                          toast({
                            title: "Fitness Certificate",
                            description: `Fitness certificate for ${certVerifiedStudent.full_name} can be generated from the Doctor Dashboard after medical clearance.`,
                          });
                        }}
                      >
                        <ClipboardCheck className="w-6 h-6 text-green-600" />
                        <span className="font-medium">Fitness Certificate</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
