import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building2, Calendar, CheckCircle2, Loader2, Mail, Search, Send, Stethoscope, User } from "lucide-react";
import { z } from "zod";

// Empanelled hospitals list
const EMPANELLED_HOSPITALS = {
  superSpecialityWarangal: [
    { name: "Rohini Super Specialty Hospital", location: "Hanamkonda" },
    { name: "Samraksha Super Specialty Hospital", location: "Warangal" },
  ],
  generalWarangal: [
    { name: "Jaya Hospital", location: "Hanamkonda" },
    { name: "Guardian Multi-Speciality Hospital", location: "Warangal" },
    { name: "Max Care Hospitals", location: "Warangal" },
    { name: "Pramoda Hospital", location: "Hanamkonda" },
    { name: "Sharat Laser Eye Hospital", location: "Hanamkonda" },
    { name: "Sri Laxmi Narasimha Hospital", location: "Hanamkonda" },
  ],
  superSpecialityHyderabad: [
    { name: "Basavatarakam Indo American Cancer Hospital", location: "Hyderabad" },
    { name: "Krishna Institute of Medical Sciences Ltd. (KIMS)", location: "Hyderabad" },
    { name: "Sunshine Hospitals", location: "Hyderabad" },
    { name: "CARE Super Speciality Hospitals", location: "Hyderabad" },
  ],
  empanelledStudents: [
    { name: "M/s. Medicover Hospitals", location: "Hyderabad & Warangal", entitlement: "Employees & Students" },
    { name: "M/s. Vijaya Diagnostic Centre Ltd.", location: "Hyderabad & Warangal", entitlement: "Employees & Students" },
    { name: "M/s. Rohini Medicare Pvt. Ltd.", location: "Hanamkonda", entitlement: "Employees & Students" },
    { name: "M/s. Ajara Hospitals", location: "Warangal", entitlement: "Employees & Students" },
    { name: "M/s. Laxmi Narasimha Hospital", location: "Hanamkonda", entitlement: "Employees & Students" },
    { name: "M/s. Samraksha Super Specialty Hospital", location: "Warangal", entitlement: "Employees & Students" },
    { name: "M/s. Dr. Sharat Maxivision Eye Hospitals", location: "Hanamkonda", entitlement: "Employees & Students" },
    { name: "M/s. Ekashilaa Hospitals", location: "Hanamkonda", entitlement: "Employees & Students" },
    { name: "M/s. Jaya Hospitals", location: "Hanamkonda", entitlement: "Employees & Students" },
    { name: "M/s. S Vision Hospital", location: "Hanamkonda", entitlement: "Employees & Students" },
    { name: "M/s. Dr. Vasavi's Hospital", location: "Naimnagar, Hanamkonda", entitlement: "Employees & Students" },
    { name: "M/s. Pebbles Kids Hospital", location: "Main Road, Balasamudram, Hanamkonda", entitlement: "Employees & Students" },
    { name: "M/s. Sri Chakra Super Speciality Hospital", location: "Balasamudram, Hanamkonda", entitlement: "Employees & Students" },
    { name: "M/s. Sri Valli Good Life Hospital", location: "Balasamudram, Hanamkonda", entitlement: "Employees & Students" },
    { name: "M/s. K&H Dental Hospitals", location: "Hanamkonda & Warangal", entitlement: "Employees & Students" },
  ],
};

// Get all hospitals as flat list for dropdown
const getAllHospitals = () => {
  const hospitals: { name: string; location: string; category: string }[] = [];
  
  EMPANELLED_HOSPITALS.empanelledStudents.forEach(h => {
    hospitals.push({ ...h, category: "Empanelled for Students" });
  });
  
  EMPANELLED_HOSPITALS.superSpecialityWarangal.forEach(h => {
    hospitals.push({ ...h, category: "Super Speciality - Warangal" });
  });
  
  EMPANELLED_HOSPITALS.generalWarangal.forEach(h => {
    hospitals.push({ ...h, category: "General - Warangal" });
  });
  
  EMPANELLED_HOSPITALS.superSpecialityHyderabad.forEach(h => {
    hospitals.push({ ...h, category: "Super Speciality - Hyderabad" });
  });
  
  return hospitals;
};

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  program: string;
  branch: string | null;
  email?: string | null;
}

// Custom schema for this form
const referralFormSchema = z.object({
  rollNumber: z.string().min(2, "Roll number is required"),
  email: z.string().email("Valid email required").regex(
    /@(nitw\.ac\.in|student\.nitw\.ac\.in|student\.nit\.ac\.in)$/,
    "Must be a valid NIT Warangal email"
  ),
  referralHospital: z.string().min(2, "Hospital name is required"),
  expectedDuration: z.string().min(1, "Expected duration is required"),
  doctorNotes: z.string().optional(),
});

type ReferralFormData = z.infer<typeof referralFormSchema>;

const DoctorReferralForm = () => {
  const { doctorId, isDoctor } = useUserRole();
  const queryClient = useQueryClient();
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      rollNumber: "",
      email: "",
      referralHospital: "",
      expectedDuration: "",
      doctorNotes: "",
    },
  });

  const hospitals = getAllHospitals();

  // Search for student by roll number and email
  const searchStudent = async () => {
    const rollNumber = form.getValues("rollNumber").trim();
    const email = form.getValues("email").trim().toLowerCase();

    if (!rollNumber || !email) {
      setSearchError("Please enter both roll number and email");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setFoundStudent(null);

    try {
      const { data, error } = await supabase
        .from("students_doctor_view")
        .select("id, full_name, roll_number, program, branch")
        .ilike("roll_number", rollNumber)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSearchError("No student found with this roll number");
        return;
      }

      // Verify email matches (check students table for email)
      const { data: studentWithEmail } = await supabase
        .from("students")
        .select("email")
        .eq("id", data.id)
        .maybeSingle();

      if (studentWithEmail?.email && studentWithEmail.email.toLowerCase() !== email) {
        setSearchError("Email does not match the student's registered email");
        return;
      }

      setFoundStudent({ ...data, email });
      toast.success("Student found", {
        description: `${data.full_name} - ${data.roll_number}`,
      });
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Failed to search for student. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const referralMutation = useMutation({
    mutationFn: async (data: ReferralFormData) => {
      if (!doctorId) throw new Error("Doctor ID not found");
      if (!foundStudent) throw new Error("Please verify student first");

      const { error } = await supabase.from("medical_leave_requests").insert({
        student_id: foundStudent.id,
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
      setFoundStudent(null);
      queryClient.invalidateQueries({ queryKey: ["medical-leave-requests"] });
    },
    onError: (error) => {
      console.error("Referral error:", error);
      toast.error("Failed to submit referral", {
        description: "Please try again or contact support.",
      });
    },
  });

  const onSubmit = (data: ReferralFormData) => {
    if (!foundStudent) {
      toast.error("Please verify student first");
      return;
    }
    referralMutation.mutate(data);
  };

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
            {/* Student Verification */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Verification
              </Label>
              <p className="text-sm text-muted-foreground">
                Enter the student's roll number and college email to verify their identity
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rollNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 21CS1045" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setFoundStudent(null);
                            setSearchError(null);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        College Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="student@student.nitw.ac.in" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setFoundStudent(null);
                            setSearchError(null);
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Must be @nitw.ac.in or @student.nitw.ac.in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={searchStudent}
                disabled={isSearching}
                className="w-full md:w-auto"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Verify Student
                  </>
                )}
              </Button>

              {searchError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}

              {foundStudent && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-medium text-primary">Student Verified</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{foundStudent.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {foundStudent.roll_number} • {foundStudent.program}
                      {foundStudent.branch && ` • ${foundStudent.branch}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Referral Details - Only show after student verification */}
            {foundStudent && (
              <>
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
                        <FormLabel>Referral Hospital</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select empanelled hospital..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="other">
                              <span className="text-muted-foreground">Other Hospital (specify below)</span>
                            </SelectItem>
                            
                            {/* Group: Empanelled for Students */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/5">
                              Empanelled for Students (2023-2024)
                            </div>
                            {EMPANELLED_HOSPITALS.empanelledStudents.map((h, idx) => (
                              <SelectItem key={`emp-${idx}`} value={h.name}>
                                <div className="flex flex-col">
                                  <span>{h.name}</span>
                                  <span className="text-xs text-muted-foreground">{h.location}</span>
                                </div>
                              </SelectItem>
                            ))}

                            {/* Group: Super Speciality Warangal */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/5 mt-2">
                              Super Speciality - Warangal
                            </div>
                            {EMPANELLED_HOSPITALS.superSpecialityWarangal.map((h, idx) => (
                              <SelectItem key={`ssw-${idx}`} value={h.name}>
                                <div className="flex flex-col">
                                  <span>{h.name}</span>
                                  <span className="text-xs text-muted-foreground">{h.location}</span>
                                </div>
                              </SelectItem>
                            ))}

                            {/* Group: General Warangal */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/5 mt-2">
                              General Hospitals - Warangal
                            </div>
                            {EMPANELLED_HOSPITALS.generalWarangal.map((h, idx) => (
                              <SelectItem key={`gw-${idx}`} value={h.name}>
                                <div className="flex flex-col">
                                  <span>{h.name}</span>
                                  <span className="text-xs text-muted-foreground">{h.location}</span>
                                </div>
                              </SelectItem>
                            ))}

                            {/* Group: Super Speciality Hyderabad */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/5 mt-2">
                              Super Speciality - Hyderabad
                            </div>
                            {EMPANELLED_HOSPITALS.superSpecialityHyderabad.map((h, idx) => (
                              <SelectItem key={`ssh-${idx}`} value={h.name}>
                                <div className="flex flex-col">
                                  <span>{h.name}</span>
                                  <span className="text-xs text-muted-foreground">{h.location}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select from empanelled hospitals (01.07.2023 - 30.06.2024)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("referralHospital") === "other" && (
                    <FormItem>
                      <FormLabel>Other Hospital Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter hospital name..."
                          onChange={(e) => form.setValue("referralHospital", e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}

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
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DoctorReferralForm;
