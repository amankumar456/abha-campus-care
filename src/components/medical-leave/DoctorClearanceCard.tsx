import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, ShieldCheck, Stethoscope, User } from "lucide-react";
import { format } from "date-fns";
import { 
  notifyStudentOfStatusUpdate, 
  notifyStudentOfCertificate,
  getStudentUserId 
} from "@/lib/notifications/medical-leave-notifications";

interface LeaveRequest {
  id: string;
  student_id: string;
  referral_hospital: string;
  illness_description: string | null;
  actual_return_date: string | null;
  health_centre_visited: boolean | null;
  doctor_clearance: boolean | null;
  students?: {
    full_name: string;
    roll_number: string;
  } | null;
}

interface DoctorClearanceCardProps {
  leaveRequest: LeaveRequest;
  doctorId: string;
  onSuccess?: () => void;
}

const DoctorClearanceCard = ({ leaveRequest, doctorId, onSuccess }: DoctorClearanceCardProps) => {
  const queryClient = useQueryClient();
  const [fitConfirmed, setFitConfirmed] = useState(false);

  const clearanceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("medical_leave_requests")
        .update({
          doctor_clearance: true,
          doctor_clearance_date: new Date().toISOString(),
          cleared_by_doctor_id: doctorId,
        })
        .eq("id", leaveRequest.id);

      if (error) throw error;

      // Notify student
      const studentUserId = await getStudentUserId(leaveRequest.student_id);
      if (studentUserId) {
        await notifyStudentOfStatusUpdate(
          studentUserId,
          "returned",
          "Your doctor has confirmed you are fit to resume classes. Your medical leave cycle is now complete."
        );
        await notifyStudentOfCertificate(studentUserId, {
          type: 'fitness',
          doctorName: 'Health Centre',
          details: 'You have been cleared to resume academic activities.',
        });
      }
    },
    onSuccess: () => {
      toast.success("Student cleared for classes", {
        description: `${leaveRequest.students?.full_name} has been marked as fit to resume.`,
      });
      queryClient.invalidateQueries({ queryKey: ["medical-leave-requests"] });
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to update clearance");
    },
  });

  if (leaveRequest.doctor_clearance) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Fitness Clearance Issued</AlertTitle>
        <AlertDescription className="text-green-700">
          Student has been cleared for classes.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base text-green-800">Fitness Clearance</CardTitle>
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-800">Pending</Badge>
        </div>
        <CardDescription className="text-green-700">
          Confirm student is fit to resume classes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{leaveRequest.students?.full_name}</span>
            <span className="text-muted-foreground">({leaveRequest.students?.roll_number})</span>
          </div>
          <p className="text-muted-foreground">
            Hospital: {leaveRequest.referral_hospital} • 
            Treatment: {leaveRequest.illness_description || "Medical treatment"}
          </p>
          {leaveRequest.actual_return_date && (
            <p className="text-muted-foreground">
              Returned: {format(new Date(leaveRequest.actual_return_date), "PPp")}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            <span>Health Centre Visit: </span>
            {leaveRequest.health_centre_visited ? (
              <Badge className="bg-green-100 text-green-800">✓ Visited</Badge>
            ) : (
              <Badge variant="outline" className="text-amber-700">Not yet visited</Badge>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-3 p-3 rounded-lg border bg-white">
          <Checkbox
            id="fit-confirm"
            checked={fitConfirmed}
            onCheckedChange={(v) => setFitConfirmed(v as boolean)}
          />
          <label htmlFor="fit-confirm" className="text-sm leading-relaxed cursor-pointer">
            I confirm that <strong>{leaveRequest.students?.full_name}</strong> has been examined and is 
            <strong> fit to resume regular classes and academic activities</strong>.
          </label>
        </div>

        <Button
          onClick={() => clearanceMutation.mutate()}
          disabled={!fitConfirmed || clearanceMutation.isPending}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {clearanceMutation.isPending ? "Processing..." : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Issue Fitness Clearance
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DoctorClearanceCard;
