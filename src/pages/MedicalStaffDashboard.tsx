import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import IssueCertificateDialog from "@/components/doctor/IssueCertificateDialog";
import {
  ShieldCheck, Search, FileText, ClipboardCheck, AlertTriangle, CheckCircle2,
  User, Calendar, Building, Loader2, Mail, Phone, Heart, Droplets, Pill,
  AlertCircle, Stethoscope,
} from "lucide-react";
import { format } from "date-fns";

interface VerifiedStudent {
  id: string;
  full_name: string;
  roll_number: string;
  email: string | null;
  phone: string | null;
  branch: string | null;
  program: string;
  batch: string;
  year_of_study: string | null;
  photo_url: string | null;
  mentor_name: string | null;
  mentor_contact: string | null;
}

interface StudentProfile {
  blood_group: string | null;
  known_allergies: string | null;
  current_medications: string | null;
  emergency_contact: string | null;
  emergency_relationship: string | null;
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
  referral_type: string[] | null;
  leave_start_date: string | null;
  expected_return_date: string | null;
  health_priority: string | null;
  doctor?: { name: string };
}

export default function MedicalStaffDashboard() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [activeTab, setActiveTab] = useState("leave");

  // Quick Lookup state
  const [lookupRoll, setLookupRoll] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupStudent, setLookupStudent] = useState<VerifiedStudent | null>(null);
  const [lookupProfile, setLookupProfile] = useState<StudentProfile | null>(null);
  const [lookupError, setLookupError] = useState("");

  // Student verification state
  const [rollNumber, setRollNumber] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [emailAutoFetched, setEmailAutoFetched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState<VerifiedStudent | null>(null);
  const [verifiedProfile, setVerifiedProfile] = useState<StudentProfile | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [verificationError, setVerificationError] = useState("");

  // Certificate state
  const [certRollNumber, setCertRollNumber] = useState("");
  const [certEmail, setCertEmail] = useState("");
  const [certEmailAutoFetched, setCertEmailAutoFetched] = useState(false);
  const [certVerifiedStudent, setCertVerifiedStudent] = useState<VerifiedStudent | null>(null);
  const [certVerifying, setCertVerifying] = useState(false);
  const [certError, setCertError] = useState("");

  // Quick Student Lookup
  const handleLookup = async () => {
    if (!lookupRoll.trim()) {
      setLookupError("Please enter a roll number");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    setLookupStudent(null);
    setLookupProfile(null);

    try {
      const { data: student, error } = await supabase
        .from("students")
        .select("id, full_name, roll_number, email, phone, branch, program, batch, year_of_study, photo_url, mentor_name, mentor_contact")
        .ilike("roll_number", lookupRoll.trim())
        .single();

      if (error || !student) {
        setLookupError("No student found with this roll number.");
        return;
      }

      setLookupStudent(student);

      // Fetch medical profile
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("blood_group, known_allergies, current_medications, emergency_contact, emergency_relationship")
        .eq("student_id", student.id)
        .maybeSingle();

      setLookupProfile(profile);
    } catch (err: any) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  // Auto-fetch email when roll number changes
  const handleRollNumberChange = async (value: string, target: "leave" | "cert") => {
    if (target === "leave") {
      setRollNumber(value);
      setEmailAutoFetched(false);
      setVerificationError("");
    } else {
      setCertRollNumber(value);
      setCertEmailAutoFetched(false);
      setCertError("");
    }

    if (value.trim().length >= 5) {
      const { data } = await supabase
        .from("students")
        .select("email")
        .ilike("roll_number", value.trim())
        .maybeSingle();

      if (data?.email) {
        if (target === "leave") {
          setStudentEmail(data.email);
          setEmailAutoFetched(true);
        } else {
          setCertEmail(data.email);
          setCertEmailAutoFetched(true);
        }
      }
    }
  };

  const verifyStudent = async () => {
    if (!rollNumber.trim() || !studentEmail.trim()) {
      setVerificationError("Both roll number and email are required");
      return;
    }

    setVerifying(true);
    setVerificationError("");
    setVerifiedStudent(null);
    setVerifiedProfile(null);
    setLeaveRequests([]);

    try {
      const { data: student, error } = await supabase
        .from("students")
        .select("id, full_name, roll_number, email, phone, branch, program, batch, year_of_study, photo_url, mentor_name, mentor_contact")
        .ilike("roll_number", rollNumber.trim())
        .eq("email", studentEmail.trim().toLowerCase())
        .single();

      if (error || !student) {
        setVerificationError("Student not found. Please verify the roll number and email.");
        setVerifying(false);
        return;
      }

      setVerifiedStudent(student);

      // Fetch medical profile & leave requests in parallel
      const [profileRes, leavesRes] = await Promise.all([
        supabase
          .from("student_profiles")
          .select("blood_group, known_allergies, current_medications, emergency_contact, emergency_relationship")
          .eq("student_id", student.id)
          .maybeSingle(),
        supabase
          .from("medical_leave_requests")
          .select(`
            id, status, referral_hospital, expected_duration, doctor_notes,
            referral_date, referring_doctor_id, rest_days, illness_description,
            referral_type, leave_start_date, expected_return_date, health_priority
          `)
          .eq("student_id", student.id)
          .in("status", ["doctor_referred", "student_form_pending", "on_leave"]),
      ]);

      setVerifiedProfile(profileRes.data);

      // Enrich with doctor names
      const enrichedLeaves: LeaveRequest[] = [];
      for (const leave of leavesRes.data || []) {
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
        .select("id, full_name, roll_number, email, phone, branch, program, batch, year_of_study, photo_url, mentor_name, mentor_contact")
        .ilike("roll_number", certRollNumber.trim())
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
    setEmailAutoFetched(false);
    setVerifiedStudent(null);
    setVerifiedProfile(null);
    setLeaveRequests([]);
    setVerificationError("");
  };

  const clearCertVerification = () => {
    setCertRollNumber("");
    setCertEmail("");
    setCertEmailAutoFetched(false);
    setCertVerifiedStudent(null);
    setCertError("");
  };

  const clearLookup = () => {
    setLookupRoll("");
    setLookupStudent(null);
    setLookupProfile(null);
    setLookupError("");
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-300";
      case "high": return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const renderStudentCard = (student: VerifiedStudent, profile?: StudentProfile | null) => (
    <Card className="border-green-200 bg-green-50/30">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-800">Student Verified</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {format(new Date(), "dd MMM yyyy, hh:mm a")}
          </span>
        </div>
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            {student.photo_url && <AvatarImage src={student.photo_url} alt={student.full_name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {student.full_name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{student.full_name}</h3>
            <p className="text-sm text-muted-foreground">{student.roll_number} • {student.program} • {student.batch}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{student.branch || "N/A"}</span>
              </div>
              {student.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="truncate">{student.email}</span>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{student.phone}</span>
                </div>
              )}
              {student.year_of_study && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Year {student.year_of_study}</span>
                </div>
              )}
            </div>
            {profile && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-sm">
                {profile.blood_group && (
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-red-500" />
                    <span className="font-medium">{profile.blood_group}</span>
                  </div>
                )}
                {profile.known_allergies && (
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                    <span>Allergies: {profile.known_allergies}</span>
                  </div>
                )}
                {profile.current_medications && (
                  <div className="flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-blue-500" />
                    <span>Meds: {profile.current_medications}</span>
                  </div>
                )}
                {profile.emergency_contact && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-500" />
                    <span>Emergency: {profile.emergency_contact} ({profile.emergency_relationship || "N/A"})</span>
                  </div>
                )}
              </div>
            )}
            {student.mentor_name && (
              <div className="flex items-center gap-1.5 mt-2 text-sm">
                <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Mentor: {student.mentor_name} {student.mentor_contact ? `(${student.mentor_contact})` : ""}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderVerificationForm = (
    roll: string,
    email: string,
    autoFetched: boolean,
    error: string,
    loading: boolean,
    onRollChange: (v: string) => void,
    onEmailChange: (v: string) => void,
    onVerify: () => void,
    onClear: () => void,
    description: string,
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Student Verification
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Roll Number</Label>
            <div className="relative">
              <Input
                placeholder="e.g., 21CS1045"
                value={roll}
                onChange={(e) => onRollChange(e.target.value)}
                className="pr-8"
              />
              <Mail className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              College Email
            </Label>
            <Input
              type="email"
              placeholder="student@student.nitw.ac.in"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
            {autoFetched && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Auto-fetched from database
              </p>
            )}
            <p className="text-xs text-muted-foreground">Must be @nitw.ac.in or @student.nitw.ac.in</p>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
        <Button onClick={onVerify} disabled={loading}>
          <Search className="w-4 h-4 mr-1" />
          {loading ? "Verifying..." : "Verify Student"}
        </Button>
      </CardContent>
    </Card>
  );

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
            {/* Quick Student Lookup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Quick Student Lookup
                </CardTitle>
                <CardDescription>
                  Enter a roll number to view the student's full details, profile photo, and medical info
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="e.g., 25edi0012"
                    value={lookupRoll}
                    onChange={(e) => setLookupRoll(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    className="max-w-sm"
                  />
                  <Button onClick={handleLookup} disabled={lookupLoading}>
                    {lookupLoading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-1" />
                    )}
                    Lookup
                  </Button>
                  {lookupStudent && (
                    <Button variant="outline" onClick={clearLookup}>Clear</Button>
                  )}
                </div>
                {lookupError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {lookupError}
                  </div>
                )}
              </CardContent>
            </Card>

            {lookupStudent && renderStudentCard(lookupStudent, lookupProfile)}

            {/* Student Verification */}
            {renderVerificationForm(
              rollNumber,
              studentEmail,
              emailAutoFetched,
              verificationError,
              verifying,
              (v) => handleRollNumberChange(v, "leave"),
              setStudentEmail,
              verifyStudent,
              clearVerification,
              "Enter the student's roll number to auto-fetch their official email and verify identity"
            )}

            {verifiedStudent && renderStudentCard(verifiedStudent, verifiedProfile)}

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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={leave.status === "on_leave" ? "default" : "secondary"}>
                                    {leave.status.replace(/_/g, " ").toUpperCase()}
                                  </Badge>
                                  {leave.rest_days != null && (
                                    <Badge variant="outline">{leave.rest_days} day(s) rest</Badge>
                                  )}
                                  {leave.health_priority && (
                                    <Badge className={getPriorityColor(leave.health_priority)}>
                                      {leave.health_priority.toUpperCase()} Priority
                                    </Badge>
                                  )}
                                  {leave.referral_type && leave.referral_type.length > 0 && (
                                    leave.referral_type.map((type, i) => (
                                      <Badge key={i} variant="outline" className="border-primary/30 text-primary">
                                        {type}
                                      </Badge>
                                    ))
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
                                  {leave.leave_start_date && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-muted-foreground" />
                                      <span>Leave Start: {format(new Date(leave.leave_start_date), "dd MMM yyyy")}</span>
                                    </div>
                                  )}
                                  {leave.expected_return_date && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-muted-foreground" />
                                      <span>Expected Return: {format(new Date(leave.expected_return_date), "dd MMM yyyy")}</span>
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
                        ✅ Medical leave has been approved by the doctor. You may proceed with issuing the referral letter and hospital card.
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
            {/* Direct Certificate Issuance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  Medical Certificates
                </CardTitle>
                <CardDescription>
                  Generate and print official medical certificates for students. Search for a student, select certificate type, and print.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IssueCertificateDialog
                  trigger={
                    <Button variant="outline" className="w-full h-14 text-base border-2 hover:border-primary">
                      <FileText className="w-5 h-5 mr-2" />
                      Issue Medical Certificate
                    </Button>
                  }
                  doctorId={null}
                  doctorProfile={null}
                />
              </CardContent>
            </Card>

            {/* Optional: Verify student first flow */}
            {renderVerificationForm(
              certRollNumber,
              certEmail,
              certEmailAutoFetched,
              certError,
              certVerifying,
              (v) => handleRollNumberChange(v, "cert"),
              setCertEmail,
              verifyCertStudent,
              clearCertVerification,
              "Optionally verify a student's identity before issuing certificates"
            )}

            {certVerifiedStudent && (
              <Card className="border-green-200 bg-green-50/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Student Verified</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14">
                      {certVerifiedStudent.photo_url && <AvatarImage src={certVerifiedStudent.photo_url} alt={certVerifiedStudent.full_name} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {certVerifiedStudent.full_name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{certVerifiedStudent.full_name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-1">
                        <div><p className="text-muted-foreground">Roll Number</p><p className="font-medium">{certVerifiedStudent.roll_number}</p></div>
                        <div><p className="text-muted-foreground">Branch</p><p className="font-medium">{certVerifiedStudent.branch || "N/A"}</p></div>
                        <div><p className="text-muted-foreground">Programme</p><p className="font-medium">{certVerifiedStudent.program}</p></div>
                        <div><p className="text-muted-foreground">Batch</p><p className="font-medium">{certVerifiedStudent.batch}</p></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
