import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Building2, Calendar, Edit, FileText, History, Phone, Plus, Send, User, Users } from "lucide-react";
import { studentLeaveFormSchema, StudentLeaveFormData, ACCOMPANIST_TYPES } from "@/lib/validations/medical-leave";
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
  expected_duration: string;
  doctor_notes: string | null;
  referral_date: string;
  referring_doctor_id: string | null;
  medical_officers?: {
    name: string;
  } | null;
}

interface StudentLeaveFormProps {
  leaveRequest: LeaveRequest;
  onSuccess?: () => void;
}

const StudentLeaveForm = ({ leaveRequest, onSuccess }: StudentLeaveFormProps) => {
  const queryClient = useQueryClient();
  const [useLastDetails, setUseLastDetails] = useState<boolean | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch previous leave request data for the same student
  const { data: previousLeave, isLoading: loadingPrevious } = useQuery({
    queryKey: ["previous-leave-details", leaveRequest.student_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_leave_requests")
        .select("illness_description, accompanist_type, accompanist_name, accompanist_contact, accompanist_relationship")
        .eq("student_id", leaveRequest.student_id)
        .not("student_form_submitted_at", "is", null)
        .neq("id", leaveRequest.id)
        .order("student_form_submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<StudentLeaveFormData>({
    resolver: zodResolver(studentLeaveFormSchema),
    defaultValues: {
      illnessDescription: "",
      leaveStartDate: format(new Date(), "yyyy-MM-dd"),
      expectedReturnDate: "",
      accompanistType: undefined,
      accompanistName: "",
      accompanistContact: "",
      accompanistRelationship: "",
      departureConfirmation: false,
      returnAcknowledgement: false,
    },
  });

  const handleUsePreviousDetails = () => {
    setUseLastDetails(true);
    if (previousLeave) {
      if (previousLeave.accompanist_type) {
        form.setValue("accompanistType", previousLeave.accompanist_type as "parent_guardian" | "friend" | "other");
      }
      form.setValue("accompanistName", previousLeave.accompanist_name || "");
      form.setValue("accompanistContact", previousLeave.accompanist_contact || "");
      form.setValue("accompanistRelationship", previousLeave.accompanist_relationship || "");
    }
    setIsEditing(false);
  };

  const handleNewRegistration = () => {
    setUseLastDetails(false);
    form.setValue("accompanistType", undefined as any);
    form.setValue("accompanistName", "");
    form.setValue("accompanistContact", "");
    form.setValue("accompanistRelationship", "");
    setIsEditing(false);
  };

  // Fetch student data for notifications
  const { data: studentData } = useQuery({
    queryKey: ["student-for-notification", leaveRequest.student_id],
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
    mutationFn: async (data: StudentLeaveFormData) => {
      const { error } = await supabase
        .from("medical_leave_requests")
        .update({
          illness_description: data.illnessDescription,
          leave_start_date: data.leaveStartDate,
          expected_return_date: data.expectedReturnDate,
          accompanist_type: data.accompanistType,
          accompanist_name: data.accompanistName,
          accompanist_contact: data.accompanistContact,
          accompanist_relationship: data.accompanistRelationship,
          student_form_submitted_at: new Date().toISOString(),
          status: "on_leave",
        })
        .eq("id", leaveRequest.id);

      if (error) throw error;

      if (leaveRequest.referring_doctor_id && studentData) {
        const doctorUserId = await getDoctorUserId(leaveRequest.referring_doctor_id);
        if (doctorUserId) {
          await notifyDoctorOfFormSubmission(doctorUserId, {
            studentName: studentData.full_name,
            rollNumber: studentData.roll_number,
            status: "on_leave",
            hospital: leaveRequest.referral_hospital,
          });
        }
      }

      if (studentData?.mentor_id) {
        const mentorUserId = await getMentorUserId(studentData.mentor_id);
        if (mentorUserId) {
          await notifyMentorOfStudentLeave(mentorUserId, {
            studentName: studentData.full_name,
            rollNumber: studentData.roll_number,
            hospital: leaveRequest.referral_hospital,
            status: "on_leave",
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Leave form submitted successfully", {
        description: "Your off-campus leave has been recorded. Safe travels!",
      });
      queryClient.invalidateQueries({ queryKey: ["medical-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["student-leave-status"] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Submit error:", error);
      toast.error("Failed to submit form", {
        description: "Please try again or contact the medical center.",
      });
    },
  });

  const onSubmit = (data: StudentLeaveFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="border-b bg-gradient-to-r from-amber-500/5 to-amber-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-amber-500/10">
            <FileText className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Off-Campus Medical Leave Form</CardTitle>
            <CardDescription>
              Mandatory form - Complete before departing campus
            </CardDescription>
          </div>
          <Badge variant="destructive" className="ml-auto">
            Required
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Doctor's Referral Info */}
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertTitle>Referral Information</AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            <p><strong>Hospital:</strong> {leaveRequest.referral_hospital}</p>
            <p><strong>Expected Duration:</strong> {leaveRequest.expected_duration}</p>
            <p><strong>Referred By:</strong> {leaveRequest.medical_officers?.name || "Campus Doctor"}</p>
            <p><strong>Date:</strong> {format(new Date(leaveRequest.referral_date), "PPP")}</p>
            {leaveRequest.doctor_notes && (
              <p className="text-muted-foreground text-sm mt-2">{leaveRequest.doctor_notes}</p>
            )}
          </AlertDescription>
        </Alert>

        {/* Use Previous Details Option */}
        {previousLeave && useLastDetails === null && !loadingPrevious && (
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 space-y-3">
            <h4 className="font-semibold flex items-center gap-2 text-foreground">
              <History className="h-4 w-4 text-primary" />
              Previous Leave Details Found
            </h4>
            <p className="text-sm text-muted-foreground">
              We found accompaniment details from your last medical leave. Would you like to reuse them?
            </p>
            {previousLeave.accompanist_name && (
              <div className="p-3 rounded-md bg-background border text-sm space-y-1">
                <p><strong>Accompanist:</strong> {previousLeave.accompanist_name}</p>
                <p><strong>Type:</strong> {previousLeave.accompanist_type || "—"}</p>
                <p><strong>Contact:</strong> {previousLeave.accompanist_contact || "—"}</p>
                <p><strong>Relationship:</strong> {previousLeave.accompanist_relationship || "—"}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleUsePreviousDetails} className="gap-2">
                <History className="h-4 w-4" />
                Use Previous Details
              </Button>
              <Button variant="outline" onClick={handleNewRegistration} className="gap-2">
                <Plus className="h-4 w-4" />
                Enter New Details
              </Button>
            </div>
          </div>
        )}

        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Instructions</AlertTitle>
          <AlertDescription>
            Complete this form in full before leaving campus. Inaccurate information may lead to disciplinary action.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Part A: Treatment Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary">A</span>
                Treatment Details
              </h3>

              <FormField
                control={form.control}
                name="illnessDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature of Illness/Treatment</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Fractured Arm, Appendicitis Surgery, Viral infection requiring specialized care..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Briefly describe the diagnosed condition (max 300 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="leaveStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Leave Start Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedReturnDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Expected Return Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Part B: Departure & Safety Details */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary">B</span>
                  Departure & Safety Details
                </h3>
                {useLastDetails !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-1.5 text-primary"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {isEditing ? "Done Editing" : "Edit Details"}
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name="departureConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg border bg-muted/30">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Departure Declaration</FormLabel>
                      <FormDescription>
                        I confirm that I am leaving the campus for the aforementioned medical treatment.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Accompaniment Details (Mandatory)
                  </h4>
                  {useLastDetails === true && !isEditing && (
                    <Badge variant="secondary" className="gap-1">
                      <History className="h-3 w-3" />
                      From previous leave
                    </Badge>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="accompanistType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I will be accompanied by</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={useLastDetails === true && !isEditing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select accompanist type..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACCOMPANIST_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accompanistName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Name of Accompanist
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Full name..."
                            disabled={useLastDetails === true && !isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accompanistContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Contact Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            disabled={useLastDetails === true && !isEditing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="accompanistRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship to Student</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Father, Mother, Friend, Uncle..."
                          disabled={useLastDetails === true && !isEditing}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Part C: Return Commitment */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary">C</span>
                Return Commitment
              </h3>

              <FormField
                control={form.control}
                name="returnAcknowledgement"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-amber-800 dark:text-amber-200">
                        Return Acknowledgement
                      </FormLabel>
                      <FormDescription className="text-amber-700 dark:text-amber-300">
                        I understand that I must formally notify the system upon my return to the hostel within 2 hours of arrival.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                "Submitting Form..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Form
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Upon submission, a copy will be sent to the Medical Center, Hostel Warden, and Department Office.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StudentLeaveForm;
