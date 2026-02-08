import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Building2, 
  Calendar, 
  Clock, 
  FileText, 
  Stethoscope, 
  AlertTriangle,
  Phone,
  MapPin,
  ExternalLink,
  Printer
} from "lucide-react";
import { format } from "date-fns";
import PrintableReferralLetter from "./PrintableReferralLetter";

interface LeaveRequest {
  id: string;
  referral_hospital: string;
  expected_duration: string;
  doctor_notes: string | null;
  referral_date: string;
  rest_days: number | null;
  health_priority: string | null;
  illness_description: string | null;
  leave_start_date: string | null;
  expected_return_date: string | null;
  medical_officers?: {
    name: string;
    designation?: string;
    qualification?: string;
    is_senior?: boolean;
  } | null;
}

interface StudentProfile {
  full_name: string;
  roll_number: string;
  program: string;
  branch?: string | null;
  year_of_study?: string | null;
}

interface ReferralDetailsCardProps {
  leaveRequest: LeaveRequest;
  studentProfile?: StudentProfile | null;
}

const getPriorityBadge = (priority: string | null) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />High Priority</Badge>;
    case "medium":
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 gap-1"><Clock className="h-3 w-3" />Medium Priority</Badge>;
    case "low":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Low Priority</Badge>;
    default:
      return null;
  }
};

const ReferralDetailsCard = ({ leaveRequest, studentProfile }: ReferralDetailsCardProps) => {
  const showPrintButton = studentProfile && leaveRequest.illness_description;

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0 overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Medical Referral Letter</CardTitle>
              <CardDescription>
                Issued on {format(new Date(leaveRequest.referral_date), "PPP")}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getPriorityBadge(leaveRequest.health_priority)}
            {showPrintButton && (
              <PrintableReferralLetter
                data={{
                  studentName: studentProfile.full_name,
                  rollNumber: studentProfile.roll_number,
                  program: studentProfile.program,
                  branch: studentProfile.branch,
                  hospital: {
                    name: leaveRequest.referral_hospital,
                    location: "Warangal",
                  },
                  illnessDescription: leaveRequest.illness_description || "",
                  leaveDays: leaveRequest.rest_days || 0,
                  healthPriority: leaveRequest.health_priority || "medium",
                  doctorNotes: leaveRequest.doctor_notes || undefined,
                }}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Referral Alert */}
        <Alert className="border-primary/30 bg-primary/5">
          <FileText className="h-4 w-4" />
          <AlertTitle>Off-Campus Treatment Authorized</AlertTitle>
          <AlertDescription>
            You have been referred for treatment at an external hospital. Please complete the departure form before leaving campus.
          </AlertDescription>
        </Alert>

        {/* Hospital Details */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Referral Hospital
          </h4>
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="font-semibold text-lg">{leaveRequest.referral_hospital}</p>
            {leaveRequest.illness_description && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Reason:</span> {leaveRequest.illness_description}
              </p>
            )}
          </div>
        </div>

        {/* Leave Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Leave Period
            </h4>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">
                {leaveRequest.leave_start_date 
                  ? format(new Date(leaveRequest.leave_start_date), "PPP")
                  : format(new Date(leaveRequest.referral_date), "PPP")}
              </p>
              <p className="text-sm text-muted-foreground">
                to {leaveRequest.expected_return_date 
                  ? format(new Date(leaveRequest.expected_return_date), "PPP")
                  : leaveRequest.expected_duration}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Approved Duration
            </h4>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">
                {leaveRequest.rest_days ? `${leaveRequest.rest_days} days` : leaveRequest.expected_duration}
              </p>
              <p className="text-sm text-muted-foreground">
                Expected treatment duration
              </p>
            </div>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Referred By
          </h4>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-medium">
              {leaveRequest.medical_officers?.name || "Campus Medical Officer"}
            </p>
            {leaveRequest.medical_officers?.designation && (
              <p className="text-sm text-muted-foreground">
                {leaveRequest.medical_officers.designation}
                {leaveRequest.medical_officers.qualification && ` • ${leaveRequest.medical_officers.qualification}`}
              </p>
            )}
            {leaveRequest.doctor_notes && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                "{leaveRequest.doctor_notes}"
              </p>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Important Instructions</AlertTitle>
          <AlertDescription className="text-amber-700 space-y-1">
            <p>1. Complete the departure form before leaving campus.</p>
            <p>2. Carry this referral letter and your ID card to the hospital.</p>
            <p>3. Submit return notification within 2 hours of arriving back.</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ReferralDetailsCard;
