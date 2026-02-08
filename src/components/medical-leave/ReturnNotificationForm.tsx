import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building2, Calendar, CheckCircle2, Home } from "lucide-react";
import { returnNotificationSchema, ReturnNotificationFormData } from "@/lib/validations/medical-leave";
import { format } from "date-fns";
import { 
  notifyDoctorOfFormSubmission, 
  notifyMentorOfStudentLeave,
  getDoctorUserId,
  getMentorUserId
} from "@/lib/notifications/medical-leave-notifications";

interface LeaveRequest {
  id: string;
  student_id: string;
  referral_hospital: string;
  illness_description: string | null;
  leave_start_date: string | null;
  expected_return_date: string | null;
  accompanist_name: string | null;
  accompanist_relationship: string | null;
  referring_doctor_id: string | null;
}

interface ReturnNotificationFormProps {
  leaveRequest: LeaveRequest;
  onSuccess?: () => void;
}

const ReturnNotificationForm = ({ leaveRequest, onSuccess }: ReturnNotificationFormProps) => {
  const queryClient = useQueryClient();

  const form = useForm<ReturnNotificationFormData>({
    resolver: zodResolver(returnNotificationSchema),
    defaultValues: {
      returnConfirmation: false,
      actualReturnDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      hospitalDischargeDate: "",
      followUpNotes: "",
      returnDeclaration: false,
    },
  });

  // Fetch student data for notifications
  const { data: studentData } = useQuery({
    queryKey: ["student-for-return-notification", leaveRequest.student_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("full_name, roll_number, mentor_id")
        .eq("id", leaveRequest.student_id)
        .single();
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ReturnNotificationFormData) => {
      const { error } = await supabase
        .from("medical_leave_requests")
        .update({
          actual_return_date: data.actualReturnDate,
          hospital_discharge_date: data.hospitalDischargeDate,
          follow_up_notes: data.followUpNotes || null,
          return_submitted_at: new Date().toISOString(),
          status: "returned",
        })
        .eq("id", leaveRequest.id);

      if (error) throw error;

      // Notify doctor about return
      if (leaveRequest.referring_doctor_id && studentData) {
        const doctorUserId = await getDoctorUserId(leaveRequest.referring_doctor_id);
        if (doctorUserId) {
          await notifyDoctorOfFormSubmission(doctorUserId, {
            studentName: studentData.full_name,
            rollNumber: studentData.roll_number,
            status: "returned",
            hospital: leaveRequest.referral_hospital,
          });
        }
      }

      // Notify mentor about student's return
      if (studentData?.mentor_id) {
        const mentorUserId = await getMentorUserId(studentData.mentor_id);
        if (mentorUserId) {
          await notifyMentorOfStudentLeave(mentorUserId, {
            studentName: studentData.full_name,
            rollNumber: studentData.roll_number,
            hospital: leaveRequest.referral_hospital,
            status: "returned",
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Return notification submitted", {
        description: "Welcome back! Your leave has been closed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["medical-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["student-leave-status"] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Submit error:", error);
      toast.error("Failed to submit return notification", {
        description: "Please try again or contact the medical center.",
      });
    },
  });

  const onSubmit = (data: ReturnNotificationFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="border-b bg-gradient-to-r from-green-500/5 to-green-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-500/10">
            <Home className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Return from Medical Leave</CardTitle>
            <CardDescription>
              Welcome back! Please complete this within 2 hours of arriving.
            </CardDescription>
          </div>
          <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-200">
            Return Form
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Leave Summary */}
        <Alert className="bg-muted/50">
          <Building2 className="h-4 w-4" />
          <AlertTitle>Leave Summary</AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            <p><strong>Hospital:</strong> {leaveRequest.referral_hospital}</p>
            {leaveRequest.illness_description && (
              <p><strong>Treatment:</strong> {leaveRequest.illness_description}</p>
            )}
            {leaveRequest.leave_start_date && (
              <p><strong>Leave Started:</strong> {format(new Date(leaveRequest.leave_start_date), "PPP")}</p>
            )}
            {leaveRequest.expected_return_date && (
              <p><strong>Expected Return:</strong> {format(new Date(leaveRequest.expected_return_date), "PPP")}</p>
            )}
            {leaveRequest.accompanist_name && (
              <p><strong>Accompanied By:</strong> {leaveRequest.accompanist_name} ({leaveRequest.accompanist_relationship})</p>
            )}
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="returnConfirmation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-green-800 dark:text-green-200">
                      I confirm my return to the hostel
                    </FormLabel>
                    <FormDescription className="text-green-700 dark:text-green-300">
                      Yes, I have returned to the campus hostel.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="actualReturnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Actual Return Date & Time
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hospitalDischargeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Hospital Discharge Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="followUpNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Instructions from Hospital (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any follow-up appointments, medications, or care instructions..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share any important follow-up care instructions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="returnDeclaration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg border">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Declaration</FormLabel>
                    <FormDescription>
                      I declare that I have resumed residence at the hostel and am concluding my off-campus medical leave period.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Return Notification
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This will update your status to "Active - Returned" and close the leave request.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReturnNotificationForm;
