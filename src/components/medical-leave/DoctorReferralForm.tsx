import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Building2, Calendar, Send, Stethoscope, User } from "lucide-react";
import { doctorReferralSchema, DoctorReferralFormData } from "@/lib/validations/medical-leave";

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  program: string;
  branch: string | null;
}

const DoctorReferralForm = () => {
  const { doctorId, isDoctor } = useUserRole();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<DoctorReferralFormData>({
    resolver: zodResolver(doctorReferralSchema),
    defaultValues: {
      studentId: "",
      referralHospital: "",
      expectedDuration: "",
      doctorNotes: "",
    },
  });

  // Fetch students for selection
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["students-for-referral", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("students_doctor_view")
        .select("id, full_name, roll_number, program, branch")
        .order("full_name");

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,roll_number.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Student[];
    },
    enabled: isDoctor,
  });

  const referralMutation = useMutation({
    mutationFn: async (data: DoctorReferralFormData) => {
      if (!doctorId) throw new Error("Doctor ID not found");

      const { error } = await supabase.from("medical_leave_requests").insert({
        student_id: data.studentId,
        referring_doctor_id: doctorId,
        referral_hospital: data.referralHospital,
        expected_duration: data.expectedDuration,
        doctor_notes: data.doctorNotes || null,
        status: "student_form_pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Referral submitted successfully", {
        description: "The student has been notified to complete the leave form.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["medical-leave-requests"] });
    },
    onError: (error) => {
      console.error("Referral error:", error);
      toast.error("Failed to submit referral", {
        description: "Please try again or contact support.",
      });
    },
  });

  const onSubmit = (data: DoctorReferralFormData) => {
    referralMutation.mutate(data);
  };

  const selectedStudent = students?.find((s) => s.id === form.watch("studentId"));

  if (!isDoctor) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Only doctors can access this form.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Off-Campus Treatment Referral</CardTitle>
            <CardDescription>
              Refer a student for external hospital treatment
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Student Information</Label>
              
              <Input
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />

              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Student</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a student..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {studentsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading students...
                          </SelectItem>
                        ) : students?.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No students found
                          </SelectItem>
                        ) : (
                          students?.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{student.full_name}</span>
                                <Badge variant="outline" className="ml-2">
                                  {student.roll_number}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedStudent && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-medium">{selectedStudent.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedStudent.roll_number} • {selectedStudent.program}
                    {selectedStudent.branch && ` • ${selectedStudent.branch}`}
                  </p>
                </div>
              )}
            </div>

            {/* Referral Details */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Referral Details
              </Label>

              <FormField
                control={form.control}
                name="referralHospital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Hospital Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter hospital name..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Name of the external hospital for treatment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Expected Treatment Duration
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 3-5 days, 1 week..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctorNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any relevant medical notes..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These notes will be visible to authorized personnel only
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Declaration */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Medical Declaration
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                By submitting this referral, I confirm that the student is medically unfit 
                to remain on campus and requires off-campus treatment at the specified hospital.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={referralMutation.isPending}
            >
              {referralMutation.isPending ? (
                "Submitting Referral..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Referral & Notify Student
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DoctorReferralForm;
