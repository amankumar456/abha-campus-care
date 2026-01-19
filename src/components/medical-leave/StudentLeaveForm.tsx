import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { AlertTriangle, Building2, Calendar, FileText, Phone, Send, User, Users } from "lucide-react";
import { studentLeaveFormSchema, StudentLeaveFormData, ACCOMPANIST_TYPES } from "@/lib/validations/medical-leave";
import { format } from "date-fns";

interface LeaveRequest {
  id: string;
  referral_hospital: string;
  expected_duration: string;
  doctor_notes: string | null;
  referral_date: string;
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
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
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

        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
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
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary">B</span>
                Departure & Safety Details
              </h3>

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
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Accompaniment Details (Mandatory)
                </h4>

                <FormField
                  control={form.control}
                  name="accompanistType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I will be accompanied by</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                          <Input placeholder="Full name..." {...field} />
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
                        <Input placeholder="e.g., Father, Mother, Friend, Uncle..." {...field} />
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
